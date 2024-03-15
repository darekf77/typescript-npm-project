//#region imports
import { _, frameworkName } from 'tnp-core/src';
import chalk from 'chalk';
import { fse } from 'tnp-core/src'
import { path } from 'tnp-core/src'
import { glob } from 'tnp-core/src';

import { Project } from '../../abstract/project/project';
import { BuildOptions } from 'tnp-db/src';
import { Models } from 'tnp-models/src';
import { config, ConfigModels } from 'tnp-config/src';
import { Helpers } from 'tnp-helpers/src';
import { PROGRESS_DATA } from 'tnp-models/src';
import { EnvironmentConfig } from '../environment-config';
import { Log } from 'ng2-logger/src';
import { Morphi as Firedev } from 'morphi/src';
import { BuildProcess, BuildProcessController } from './app/build-process';
import { CLI } from 'tnp-cli/src';
import { DEFAULT_PORT, PortUtils, tmpBuildPort } from '../../../constants';
import { FeatureForProject } from '../../abstract/feature-for-project';
// import { FiredevBinaryFile, FiredevBinaryFileController, FiredevFile, FiredevFileController, FiredevFileCss } from 'firedev-ui';

const log = Log.create(__filename)

//#endregion

export class BuildProcessFeature extends FeatureForProject {

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
    options = BuildProcessFeature.prepareOptionsBuildProcess(options, this.project) as any;
    options.appBuild = false;
    const buildOptions: BuildOptions = await BuildOptions.from(options.args, this.project as any, options, 'startForLib');
    await this.build(buildOptions, config.allowedTypes.libs, exit);
  }

  async startForAppFromArgs(prod: boolean, watch: boolean, outDir: Models.dev.BuildDir, args: string) {
    return this.startForApp({ prod, watch, outDir, args });
  }

  async startForApp(options: Models.dev.StartForOptions, exit = true) {
    options = BuildProcessFeature.prepareOptionsBuildProcess(options, this.project) as any;
    options.appBuild = true;
    const buildOptions: BuildOptions = await BuildOptions.from(options.args, this.project as any, options, 'startForApp');
    await this.build(buildOptions, config.allowedTypes.app, exit);
  }
  //#endregion

  private async build(buildOptions: BuildOptions, allowedLibs: ConfigModels.LibType[], exit = true) {
    //#region initial messages
    const forAppRelaseBuild = (buildOptions?.args?.trim()?.search('--forAppRelaseBuild') !== -1);

    if (!this.project.copyManager.coreContainerSmartNodeModulesProj) {
      Helpers.error(`${_.upperFirst(config.frameworkName)} has incorrect/missing packages container.
Please use command:

      ${config.frameworkName} autoupdate
      // or
      ${config.frameworkName} au

to fix it.
      `, false, true)
    }

    if (this.project.frameworkVersionLessThan('v4')) {
      Helpers.error(`Please upgrade firedev framework version to to at least v4

      ${config.file.package_json__tnp_json} => tnp.version => should be at least 4

      `, false, true);
    }

    log.data(`

    BUILD PID: ${process.pid}
    BUILD PPID: ${process.ppid}

    `)

    log.data(`[build] in build of ${this.project.genericName}, type: ${this.project.type}`);
    //#endregion

    this.project.buildOptions = buildOptions;
    // const websql = !!buildOptions.websql;

    //#region make sure project allowed for build
    if (_.isArray(allowedLibs) && this.project.typeIsNot(...allowedLibs)) {
      if (buildOptions.appBuild) {
        Helpers.error(`App build only for ${config.frameworkName} ${chalk.bold(allowedLibs.join(','))} project types`, false, true)
      } else {
        Helpers.error(`Library build only for ${config.frameworkName} ${chalk.bold(allowedLibs.join(','))} project types`, false, true)
      }
    }
    //#endregion


    if (!buildOptions.appBuild && !forAppRelaseBuild) {
      //#region main lib code build ports assignations
      const projectInfoPort = await this.project.assignFreePort(4100);
      this.project.setProjectInfoPort(projectInfoPort);
      Helpers.writeFile(this.project.pathFor(tmpBuildPort), projectInfoPort?.toString());

      const host = `http://localhost:${projectInfoPort}`;
      Helpers.info(`



  You can check info about build in ${CLI.chalk.bold(host)}



        `)
      Helpers.taskStarted(`starting project service... ${host}`)
      try {
        const context = await Firedev.init({
          mode: 'backend/frontend-worker',
          host,
          controllers: [
            BuildProcessController,
          ],
          entities: [
            BuildProcess,
          ],
          //#region @websql
          config: {
            type: 'better-sqlite3',
            database:
              //  config.frameworkName === 'firedev' ?
              ':memory:'
            //  as any : this.project.pathFor(`tmp-build-process.sqlite`)
            ,
            logging: false,
          }
          //#endregion
        });
        const controller: BuildProcessController = context.getInstanceBy(BuildProcessController) as any;
        await controller.initialize(this.project);
      } catch (error) {
        console.error(error);
        Helpers.error(`Please reinstall ${config.frameworkName} node_modules`, false, true);
      }

      this.project.saveLaunchJson(projectInfoPort);
      Helpers.taskDone('project service started')
      // console.log({ context })
      //#endregion
    }

    if (buildOptions.appBuild) { // TODO is this ok baw is not initing ?

      if (!forAppRelaseBuild) {
        //#region initializae client app remote connection to build server
        const projectInfoPortFromFile = Number(Helpers.readFile(this.project.pathFor(tmpBuildPort)));
        this.project.setProjectInfoPort(projectInfoPortFromFile);

        const host = `http://localhost:${projectInfoPortFromFile}`;
        try {
          const context = await Firedev.init({
            mode: 'remote-backend',
            host,
            controllers: [
              BuildProcessController,
            ],
            entities: [
              BuildProcess,
            ]
          });
          const controller: BuildProcessController = context.getInstanceBy(BuildProcessController) as any;
          await controller.initialize(this.project);
          // this.project.standaloneNormalAppPort = (await controller.getPortForClient().received).body.numericValue;
        } catch (error) {
          console.error(error);
          Helpers.error(`Please reinstall ${config.frameworkName} node_modules`, false, true);
        }
        this.project.saveLaunchJson(projectInfoPortFromFile);
        //#endregion
      }

      if (!this.project.node_modules.exist) {
        //#region prevent empty node_modules
        Helpers.error(`Please start lib build first:

        ${config.frameworkName} build:watch # short -> ${config.frameworkName} bw
or use command:

${config.frameworkName} start

        `, false, true);
        //#endregion
      }

    } else {
      //#region normal/watch lib build
      if (buildOptions.watch) {
        log.data('is lib build watch')
        await this.project.filesStructure.init(buildOptions.args, { watch: true, watchOnly: buildOptions.watchOnly });
      } else {
        await this.project.filesStructure.init(buildOptions.args);
      }
      //#endregion
    }
    log.data('before file templates')

    //#region handle build clients projects

    log.data(`

    projec: ${this.project.genericName}
    type: ${this.project.type}
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
