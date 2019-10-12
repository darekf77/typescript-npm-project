//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';
import * as inquirer from 'inquirer';

import { Helpers } from '../../helpers';
import { config } from '../../config';
import { Models } from '../../models';
import { IncrementalBuildProcessExtended } from '../compilers/build-isomorphic-lib/incremental-build-process';
import { BuildOptions } from '../features';
import { selectClients } from './select-clients';
//#endregion
import { Project } from '../abstract';


export class ProjectIsomorphicLib extends Project {

  //#region @backend
  startOnCommand(args: string) {
    const command = `ts-node run.js ${args}`;
    return command;
  }

  sourceFilesToIgnore() {
    let toIgnore = [
      `src/${config.file.entities_ts}`,
      `src/${config.file.controllers_ts}`,
    ];
    if (this.isSite) {
      toIgnore = toIgnore.concat(toIgnore.map(f => `${config.folder.custom}/${f}`))
    }
    return toIgnore;
  }

  projectSpecyficFiles(): string[] {
    return super.projectSpecyficFiles()
      .concat([
        '.vscode/launch.json',
        'tsconfig.browser.json',
        'webpack.config.js',
        'run.js',
        ...this.filesTemplates(),
      ]).concat(
      !this.isStandaloneProject ? [
        'src/typings.d.ts',
      ] : []);
  }

  filesTemplates() {
    return [
      'tsconfig.json.filetemplate',
    ];
  }

  projectSpecyficIgnoredFiles() {
    return [
      'src/entities.ts',
      'src/controllers.ts'
    ].concat(this.projectSpecyficFiles())
  }

  private async selectToSimulate(outDir: Models.dev.BuildDir, watch: boolean, forClient: Project[] | string[]) {
    let webpackEnvParams = `--env.outFolder=${outDir}`;
    webpackEnvParams = webpackEnvParams + (watch ? ' --env.watch=true' : '');

    let client = _.first(forClient as Project[]);

    if (!global.tnpNonInteractive) {
      if (!this.isStandaloneProject && forClient.length === 0) {
        const answer: { project: string } = await inquirer
          .prompt([
            {
              type: 'list',
              name: 'project',
              message: 'Which project do you wanna simulate ?',
              choices: this.parent.children
                .filter(c => config.allowedTypes.app.includes(c.type))
                .filter(c => c.name !== this.name)
                .map(c => c.name),
              filter: function (val) {
                return val.toLowerCase();
              }
            }
          ]) as any;
        // console.log('ANSWER', answer)
        client = Project.From(path.join(this.location, '..', answer.project));
      }
    }

    if (client) {
      const port = client.getDefaultPort()
      await Helpers.killProcessByPort(port)
      webpackEnvParams = `${webpackEnvParams} --env.moduleName=${client.name} --env.port=${port}`
    }

    const command = `npm-run webpack-dev-server ${webpackEnvParams}`;
    // console.log(command)

    this.run(command).sync();
  }

  async buildSteps(buildOptions?: BuildOptions) {
    const { prod, watch, outDir, onlyWatchNoBuild, appBuild, args, forClient = [] } = buildOptions;
    if (!onlyWatchNoBuild) {
      if (appBuild) {
        if (!watch) {
          Helpers.log(`App build not possible for isomorphic-lib in static build mode`)
          return;
        }
        await this.selectToSimulate(outDir, watch, forClient);
      } else {
        await this.buildLib();
      }
    }
    return;
  }

  private copyWhenExist(source: string, outDir: string) {
    const basename = source;
    source = path.join(this.location, source);
    outDir = path.join(this.location, outDir, basename);
    // console.log(`Copy from ${source} to ${outDir}`)
    if (fse.existsSync(source)) {
      if (fse.lstatSync(source).isDirectory()) {
        // console.log('copy folder')
        Helpers.tryCopyFrom(source, outDir)
      } else {
        // console.log('copy copyfile')
        // fse.copyFileSync(source, outDir);
        Helpers.copyFile(source, outDir)
      }
    } else {
      // console.log('not exist', source)
    }
  }
  private linkWhenExist(source: string, outLInk: string) {
    const basename = source;
    source = path.join(this.location, source);
    outLInk = path.join(this.location, outLInk, basename);

    if (fse.existsSync(source)) {
      Helpers.createSymLink(source, outLInk)
    }
  }

  async buildLib() {
    const { outDir } = this.buildOptions;
    // console.log('Build fucking this', this.buildOptions)
    this.copyWhenExist('bin', outDir);
    this.copyWhenExist('package.json', outDir);
    this.copyWhenExist('.npmrc', outDir);
    this.copyWhenExist('.npmignore', outDir);
    this.copyWhenExist('.gitignore', outDir);
    if (outDir === 'bundle') {
      this.linkWhenExist(config.folder.node_modules, outDir);
      if (this.isTnp) {
        this.linkWhenExist('projects', outDir);
        this.linkWhenExist('tests', outDir);
        this.linkWhenExist('autobuild.json', outDir);
      }
    }

    if (!this.isStandaloneProject && this.buildOptions.forClient.length === 0) {
      while (this.buildOptions.forClient.length === 0) {
        await selectClients(this.buildOptions, this);
      }
    }

    const { skipBuild = false } = require('minimist')(this.buildOptions.args.split(' '));
    if (skipBuild) {
      Helpers.log(`Skip build `);
      return;
    }
    if (this.buildOptions.watch) {
      await (new IncrementalBuildProcessExtended(this, this.buildOptions)).startAndWatch('isomorphic compilation (watch mode)')
    } else {
      await (new IncrementalBuildProcessExtended(this, this.buildOptions)).start('isomorphic compilation')
    }
  }
  //#endregion
}


//#region @backend
export function getReservedClassNames(project = Project.Current) {
  // console.log('get class names from : ' + project.name)
  // console.log('parent : ' + (project.parent && project.parent.name))
  // console.log('childeren' + (project.parent && project.parent.children.map(c => c.name)));
  // console.log('children isomorphic: ' + (project.parent && project.parent.children
  //     .filter((p) => p.type === 'isomorphic-lib')
  //     .map(c => c.name))
  // );
  if (project && project.parent && project.parent.type === 'workspace'
    && Array.isArray(project.parent.children)
    && project.parent.children.length > 0) {


    const names = []
    project.parent.children
      .filter((p) => p.type === 'isomorphic-lib')
      .forEach(p => {

        const controllers = Helpers.morphi.getControllers(path.join(
          p.location,
          config.folder.src
        ))

        // console.log('controllers', controllers)
        controllers.forEach(c => {
          names.push(path.basename(c, '.ts'))
        });

        const entities = Helpers.morphi.getEntites(path.join(
          p.location,
          config.folder.src
        ))
        // const entities = glob.sync(`${path.join(
        //   p.location,
        //   config.folder.src,
        //   config.folder.entities
        // )}/**/*.ts`)
        // console.log('entities', entities)
        entities.forEach(e => {
          names.push(path.basename(e, '.ts'))
        });
      })
    return names;
  }
  return [];
}
//#endregion
