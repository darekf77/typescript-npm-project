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
import { Helpers, Condition } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';
import { PROGRESS_DATA } from 'tnp-models';
import { handleProjectsPorts } from '../environment-config/environment-config-helpers';
import { selectClients } from '../../project-specyfic/select-clients.backend';
import { EnvironmentConfig } from '../environment-config';
import { Log } from 'ng2-logger';

const log = Log.create(__filename)

//#endregion

export class BuildProcess extends FeatureForProject {
  //#region start for ...
  /**
   * prod, watch, outDir, args, overrideOptions
   */
  async startForLib(options: BuildOptions, exit = true) {
    const buildOptions: BuildOptions<Project> = await BuildOptions.from(options.argsString, this.project as any, options, 'startForLib') as any;
    await this.build(buildOptions, config.allowedTypes.libs, exit);
  }

  async startForApp(options: BuildOptions, exit = true) {
    const buildOptions: BuildOptions<Project> = await BuildOptions.from(options.argsString, this.project as any, options, 'startForApp') as any;
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

  private async build(buildOptions: BuildOptions<Project>, allowedLibs: ConfigModels.LibType[], exit = true) {

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

    log.data(`[db] chekcking started... `);
    const db = await TnpDB.Instance();

    if (buildOptions.appBuild) {
      log.data('FIST check if build allowed')
      await db.checkBuildIfAllowed(
        this.project as any,
        buildOptions,
        process.pid,
        process.ppid,
        true
      );
      log.data(`[db]] finish `);
    } else {
      log.data(`[db] no needed for dist`);
    }


    if (buildOptions.appBuild) { // TODO is this ok baw is not initing ?

      if (this.project.node_modules.exist) {
        log.data(`NODE MODULE EXISTS`)
      } else {
        await this.project.filesStructure.init(buildOptions);
      }

      if (this.project.frameworkVersionAtLeast('v3') && this.project.typeIs('isomorphic-lib')) {
        this.project.insideStructure.recrate(buildOptions);
      }

      if (this.project.isSmartContainer) {

        if (buildOptions.client) {
          await (buildOptions.client as Project).insideStructure.recrate(buildOptions);
        }
      }

      if (buildOptions.watch) {
        await this.project.filesStructure.init(buildOptions);
      }

    } else {
      await this.project.filesStructure.init(buildOptions);
    }
    log.data('before file templates')

    //#region update environment data for "childs"
    if (this.project.isStandaloneProject) {
      await (this.project.env as any as EnvironmentConfig).updateData();
    }
    //#endregion

    //#region report initial progres
    if (!buildOptions.watch && this.project.isGenerated && this.project.isWorkspace) {
      PROGRESS_DATA.log({ value: 0, msg: `Static build initing` });
    }
    //#endregion
    if (buildOptions.appBuild) {
      log.data('Second check if build allowed')
      await db.checkBuildIfAllowed(
        this.project as any,
        buildOptions,
        process.pid,
        process.ppid,
        false
      )
    }

    //#region handle build clients projects

    log.data(`

    projec: ${this.project.genericName}
    type: ${this.project._type}
    generated: ${this.project.isGenerated}
    `);


    if (buildOptions.appBuild) {
      // if (!singularBuildInParent) { // TODO UNCOMMENT
      //   await waitForAppBuildToBePossible(db, this.project);
      // }
    } else {
      await selectClients(buildOptions, this.project, db);
      // await waitForRequiredDistsBuilds(db, this.project, buildOptions.forClient as any[]);
    }

    //#endregion

    //#region report start building message
    // console.log('WEBSQL', buildOptions.websql)

    log.taskStarted(`\n\n\t${chalk.bold('[build-process] Start of Building')} ${this.project.genericName} `
      + `(${buildOptions.appBuild ? 'app' : 'lib'}) ${buildOptions.websql ? '[WEBSQL]' : ''}\n\n`);
    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg: `[build-process] Start of building ${this.project.genericName} ${buildOptions.websql ? '[WEBSQL]' : ''}` })
    }

    //#endregion

    await this.project.build(buildOptions);


    //#region handle end of building
    if (buildOptions.copyto.length > 0) {
      const porjectINfo = buildOptions.copyto.length === 1
        ? `project "${(_.first(buildOptions.copyto as any) as Project).name}"`
        : `all ${buildOptions.copyto.length} projects`;
      log.info(`From now... ${porjectINfo} will be updated after every change...`)
    }
    const msg = (buildOptions.watch ? `
      Files watcher started.. ${buildOptions.websql ? '[WEBSQL]' : ''}
    `: `
      End of Building ${this.project.genericName} ${buildOptions.websql ? '[WEBSQL]' : ''}

    ` )

    // if (global.tnpNonInteractive) {
    //   PROGRESS_DATA.log({ msg });
    // } else {
    log.info(msg);
    // global?.spinner?.start();
    // }

    if (exit && !buildOptions.watch) {
      log.data('Build process exit')
      process.exit(0);
    }
    //#endregion
  }

}


