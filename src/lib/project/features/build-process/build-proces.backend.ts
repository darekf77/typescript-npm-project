//#region imports
import { _ } from 'tnp-core';
import chalk from 'chalk';
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import { glob } from 'tnp-core';

import { FeatureForProject, Project } from '../../abstract';
import { BuildOptions } from 'tnp-db';
import { Models } from 'tnp-models';
import { config, ConfigModels } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { PROGRESS_DATA } from 'tnp-models';
import { EnvironmentConfig } from '../environment-config';
import { Log } from 'ng2-logger';

const log = Log.create(__filename)

//#endregion

export class BuildProcess extends FeatureForProject {

  //#region prepare build options
  public static prepareOptionsBuildProcess(options: Models.dev.StartForOptions, project: Project): BuildOptions {
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
    if (_.isUndefined(options.staticBuildAllowed)) {
      options.staticBuildAllowed = false;
    }
    if (project.isGenerated && !options.staticBuildAllowed) {
      log.error(`Please use command:
$ ${config.frameworkName} static:build
inside generated projects...
`, false, true);
    }

    if (!_.isString(options.args)) {
      options.args = ''
    }
    return BuildOptions.fromJson(options);
  }
  //#endregion

  //#region start for ...
  async startForLibFromArgs(prod: boolean, watch: boolean, outDir: Models.dev.BuildDir, args: string) {
    return this.startForLib({ prod, watch, outDir, args });
  }

  /**
   * prod, watch, outDir, args, overrideOptions
   */
  async startForLib(options: Models.dev.StartForOptions, exit = true) {
    options = BuildProcess.prepareOptionsBuildProcess(options, this.project);
    options.appBuild = false;
    const buildOptions: BuildOptions = await BuildOptions.from(options.args, this.project as any, options, 'startForLib');
    await this.build(buildOptions, config.allowedTypes.libs, exit);
  }

  async startForAppFromArgs(prod: boolean, watch: boolean, outDir: Models.dev.BuildDir, args: string) {
    return this.startForApp({ prod, watch, outDir, args });
  }

  async startForApp(options: Models.dev.StartForOptions, exit = true) {
    options = BuildProcess.prepareOptionsBuildProcess(options, this.project);
    options.appBuild = true;
    const buildOptions: BuildOptions = await BuildOptions.from(options.args, this.project as any, options, 'startForApp');
    await this.build(buildOptions, config.allowedTypes.app, exit);
  }
  //#endregion

  //#region mereg npm project
  private mergeNpmPorject() {
    // console.log(this.project.parent.getAllChildren({ unknowIncluded: true }))
    log.data(`[mergeNpmPorject] started.. for ${this.project.genericName}`)
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
        });

    }
    log.data(`[mergeNpmPorject] finish..`)
  }
  //#endregion

  private async build(buildOptions: BuildOptions, allowedLibs: ConfigModels.LibType[], exit = true) {

    if (this.project.frameworkVersionLessThan('v4')) {
      Helpers.error(`Please upgrade firedev framework version to to at least v4

      ${config.file.package_json__tnp_json} => tnp.version => should be at least 4

      `, false, true);
    }

    log.data(`

    BUILD PID: ${process.pid}
    BUILD PPID: ${process.ppid}

    `)

    log.data(`[build] in build of ${this.project.genericName}, type: ${this.project._type}`);
    this.project.buildOptions = buildOptions;

    if (this.project.isGenerated && buildOptions.watch && !this.project.isStandaloneProject) {
      buildOptions.watch = false;
      Helpers.warn(`You cannot build static project in watch mode. Change to build mode: watch=false`);
    }

    this.mergeNpmPorject();

    //#region make sure project allowed for build
    if (_.isArray(allowedLibs) && this.project.typeIsNot(...allowedLibs)) {
      if (buildOptions.appBuild) {
        Helpers.error(`App build only for ${config.frameworkName} ${chalk.bold(allowedLibs.join(','))} project types`, false, true)
      } else {
        Helpers.error(`Library build only for ${config.frameworkName} ${chalk.bold(allowedLibs.join(','))} project types`, false, true)
      }
    }
    //#endregion

    if (buildOptions.appBuild) { // TODO is this ok baw is not initing ?

      if (!this.project.node_modules.exist) {
        Helpers.error('Please start lib build first', false, true)
      }

    } else {
      if (buildOptions.watch) {
        log.data('is lib build watch')
        await this.project.filesStructure.init(buildOptions.args, { watch: true, watchOnly: buildOptions.watchOnly });
      } else {
        await this.project.filesStructure.init(buildOptions.args);
      }
    }
    log.data('before file templates')

    //#region update environment data for "childs"
    if (this.project.isStandaloneProject || this.project.isWorkspaceChildProject) {
      if (this.project.typeIs('angular-lib')) {
        this.project.filesTemplatesBuilder.rebuildFile('src/index.html.filetemplate');
      }
    }
    //#endregion

    //#region report initial progres
    if (!buildOptions.watch && this.project.isGenerated && this.project.isWorkspace) {
      PROGRESS_DATA.log({ value: 0, msg: `Static build initing` });
    }
    //#endregion

    //#region handle build clients projects

    log.data(`

    projec: ${this.project.genericName}
    type: ${this.project._type}
    generated: ${this.project.isGenerated}
    `);


    //#endregion

    //#region report start building message
    // console.log('WEBSQL', buildOptions.websql)

    log.taskStarted(`\n\t${chalk.bold('[build-process] Start of Building')} ${this.project.genericName} `
      + `(${buildOptions.appBuild ? 'app' : 'lib'}) ${buildOptions.websql ? '[WEBSQL]' : ''}\n`);
    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg: `[build-process] Start of building ${this.project.genericName} ${buildOptions.websql ? '[WEBSQL]' : ''}` })
    }

    //#endregion

    await this.project.build(buildOptions);
    //#region handle end of building

    const msg = (buildOptions.watch ? `
      Files watcher started.. ${buildOptions.websql ? '[WEBSQL]' : ''}
    `: `
      End of Building ${this.project.genericName} ${buildOptions.websql ? '[WEBSQL]' : ''}

    ` )

    log.info(msg);

    if (exit && !buildOptions.watch) {
      log.data('Build process exit')
      process.exit(0);
    }
    //#endregion
  }

}


