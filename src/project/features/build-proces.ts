//#region @backend
import * as _ from 'lodash';
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';

import { FeatureForProject, Project } from '../abstract';
import { BuildOptions } from './build-options';
import { BuildDir, LibType, StartForOptions } from '../../models';
import { config } from '../../config';
import { error, info, warn } from '../../helpers';
import { TnpDB } from '../../tnp-db';
import { PROGRESS_DATA } from '../../progress-output';


export class BuildProcess extends FeatureForProject {

  public static prepareOptionsLib(options: StartForOptions, project: Project) {
    if (_.isUndefined(options)) {
      options = {} as any;
    }
    if (_.isUndefined(options.outDir)) {
      options.outDir = 'dist';
    }
    if (_.isUndefined(options.prod)) {
      options.prod = false;
    }
    if (_.isUndefined(options.watch)) {
      options.watch = false;
    }
    if (_.isUndefined(options.watch)) {
      options.watch = false;
    }
    if (_.isUndefined(options.staticBuildAllowed)) {
      options.staticBuildAllowed = false;
    }
    if (project.isGenerated && !options.staticBuildAllowed) {
      error(`Please use command:
$ tnp static:build
inside generated projects...
`, false, true);
    }

    if (!_.isString(options.args)) {
      options.args = ''
    }
    return options;
  }

  async  startForLibFromArgs(prod: boolean, watch: boolean, outDir: BuildDir, args: string) {
    return this.startForLib({ prod, watch, outDir, args });
  }

  /**
   * prod, watch, outDir, args, overrideOptions
   */
  async  startForLib(options: StartForOptions, exit = true) {
    options = BuildProcess.prepareOptionsLib(options, this.project);
    options.appBuild = false;
    const buildOptions: BuildOptions = BuildOptions.from(options.args, this.project, options);
    await this.build(buildOptions, config.allowedTypes.libs, exit);
  }

  async  startForAppFromArgs(prod: boolean, watch: boolean, outDir: BuildDir, args: string) {
    return this.startForApp({ prod, watch, outDir, args });
  }

  async  startForApp(options: StartForOptions, exit = true) {
    options = BuildProcess.prepareOptionsLib(options, this.project);
    options.appBuild = true;
    const buildOptions: BuildOptions = BuildOptions.from(options.args, this.project, options);
    await this.build(buildOptions, config.allowedTypes.app, exit);
  }

  private mergeNpmPorject() {
    // console.log(this.project.parent.getAllChildren({ unknowIncluded: true }))
    if (this.project.isWorkspaceChildProject) {
      this.project.parent.getFolders()
        .filter(p => !this.project.parent.children.map(c => c.name).includes(path.basename(p)))
        .forEach(p => {
          const moduleInNodeModules = path.join(this.project.parent.location, config.folder.node_modules, path.basename(p));
          const moduleAsChild = path.join(this.project.parent.location, path.basename(p));

          if (fse.existsSync(moduleInNodeModules)) {
            let files = glob.sync(`${moduleAsChild}/**/*.*`);
            files = files.map(f => f.replace(moduleAsChild, ''))
            files.forEach(f => {

              const inNodeM = path.join(moduleInNodeModules, f);
              const newToReplace = path.join(moduleAsChild, f);
              if (fse.existsSync(inNodeM)) {
                if (!fse.existsSync(`${inNodeM}.orginalFile`)) {
                  fse.copyFileSync(inNodeM, `${inNodeM}.orginalFile`)
                }
                fse.copyFileSync(newToReplace, inNodeM);
              }
            });
          }
        })
    }

  }

  private get checkIfGeneratedTnpBundle() {
    return Project.Current.isTnp ? true : fse.existsSync(path.join(Project.Tnp.location, global.tnp_out_folder, config.folder.browser))
  }

  private async  build(buildOptions: BuildOptions, allowedLibs: LibType[], exit = true) {

    if (this.project.isGenerated && buildOptions.watch) {
      buildOptions.watch = false;
      warn(`You cannot build static project in watch mode. Change to build mode: watch=false`);
    }

    if (!this.checkIfGeneratedTnpBundle) {
      error(`Please compile your tsc-npm-project to tnp-bundle`, false, true)
    }

    // if (this.project.isGenerated) {
    //   this.project.reset();
    // }

    this.mergeNpmPorject();



    const { env } = require('minimist')(!buildOptions.args ? [] : buildOptions.args.split(' '));
    if (env) {
      info(`ENVIRONMENT: ${chalk.bold(env)}`)
    } else {
      if (this.project.isGenerated) {
        buildOptions.args += `${buildOptions.args} --env=static`;
        info(`ENVIRONMENT (for local static build): "${chalk.bold('static')}"`)
      } else {
        buildOptions.args += `${buildOptions.args} --env=local`;
        info(`ENVIRONMENT (for local watch development): "${chalk.bold('local')}"`)
      }

    }

    if (_.isArray(allowedLibs) && !allowedLibs.includes(this.project.type)) {
      if (buildOptions.appBuild) {
        error(`App build only for tnp ${chalk.bold(allowedLibs.join(','))} project types`, false, true)
      } else {
        error(`Library build only for tnp ${chalk.bold(allowedLibs.join(','))} project types`, false, true)
      }
    }

    const transactions = (await (await TnpDB.Instance).transaction);
    if (!this.project.isGenerated) { // TODO REMOVE THIS
      await transactions.updateBuildsWithCurrent(this.project, buildOptions, process.pid, true);
    }

    if (buildOptions.watch) {
      await this.project.filesStructure.init(buildOptions.args, { watch: true });
    } else {
      await this.project.filesStructure.init(buildOptions.args);
    }

    if (!buildOptions.watch && this.project.isGenerated && this.project.isWorkspace) {
      PROGRESS_DATA.log({ value: 0, msg: `Static build initing` });
    }

    if (!this.project.isGenerated) { // TODO REMOVE THIS
      await transactions.updateBuildsWithCurrent(this.project, buildOptions, process.pid, false)
    }
    await this.project.build(buildOptions);
    if (exit && !buildOptions.watch) {
      process.exit(0);
    }

  }


}

//#endregion
