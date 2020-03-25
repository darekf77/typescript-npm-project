//#region imports
import * as _ from 'lodash';
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';

import { FeatureForProject, Project } from '../../abstract';
import { BuildOptions } from './build-options';
import { Models } from 'tnp-models';
import { config } from '../../../config';
import { Helpers, Condition } from 'tnp-helpers';
import { TnpDB } from 'tnp-db';
import { PROGRESS_DATA } from '../../../progress-output';
import { handleProjectsPorts } from '../environment-config/environment-config-helpers';
import {
  waitForAppBuildToBePossible, waitForRequiredDistsBuilds
} from './waiting-for-builds-conditions-helpers.backend';
import { selectClients } from '../../project-specyfic/select-clients';

const allowedForSelectingCLients = [
  'angular-lib',
  'isomorphic-lib',
  'angular-client',
  'ionic-client',
] as Models.libs.LibType[];

//#endregion

export class BuildProcess extends FeatureForProject {

  //#region prepare build options
  public static prepareOptionsBuildProcess(options: Models.dev.StartForOptions, project: Project) {
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
      Helpers.error(`Please use command:
$ ${config.frameworkName} static:build
inside generated projects...
`, false, true);
    }

    if (!_.isString(options.args)) {
      options.args = ''
    }
    return options;
  }
  //#endregion

  //#region start for ...
  async  startForLibFromArgs(prod: boolean, watch: boolean, outDir: Models.dev.BuildDir, args: string) {
    return this.startForLib({ prod, watch, outDir, args });
  }

  /**
   * prod, watch, outDir, args, overrideOptions
   */
  async  startForLib(options: Models.dev.StartForOptions, exit = true) {
    options = BuildProcess.prepareOptionsBuildProcess(options, this.project);
    options.appBuild = false;
    const buildOptions: BuildOptions = BuildOptions.from(options.args, this.project, options);
    await this.build(buildOptions, config.allowedTypes.libs, exit);
  }

  async  startForAppFromArgs(prod: boolean, watch: boolean, outDir: Models.dev.BuildDir, args: string) {
    return this.startForApp({ prod, watch, outDir, args });
  }

  async  startForApp(options: Models.dev.StartForOptions, exit = true) {
    options = BuildProcess.prepareOptionsBuildProcess(options, this.project);
    options.appBuild = true;
    const buildOptions: BuildOptions = BuildOptions.from(options.args, this.project, options);
    await this.build(buildOptions, config.allowedTypes.app, exit);
  }
  //#endregion

  //#region mereg npm project
  private mergeNpmPorject() {
    // console.log(this.project.parent.getAllChildren({ unknowIncluded: true }))
    Helpers.log(`[mergeNpmPorject] started.. for ${this.project.genericName}`)
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
    Helpers.log(`[mergeNpmPorject] finish..`)
  }
  //#endregion

  private async  build(buildOptions: BuildOptions, allowedLibs: Models.libs.LibType[], exit = true) {

    Helpers.log(`[build] in build of ${this.project.genericName}, type: ${this.project.type}`);
    this.project.buildOptions = buildOptions;

    if (this.project.isGenerated && buildOptions.watch && !this.project.isStandaloneProject) {
      buildOptions.watch = false;
      Helpers.warn(`You cannot build static project in watch mode. Change to build mode: watch=false`);
    }
    const checkIfGeneratedTnpBundle = Project.Current.isTnp ? true :
      fse.existsSync(path.join(Project.Tnp.location, global.tnp_out_folder, config.folder.browser));

    if (!this.project.isStandaloneProject && !checkIfGeneratedTnpBundle) {
      Helpers.error(`Please compile your tsc-npm-project to tnp-bundle`, false, true)
    }

    this.mergeNpmPorject();

    //#region make sure project allowed for build
    if (_.isArray(allowedLibs) && !allowedLibs.includes(this.project.type)) {
      if (buildOptions.appBuild) {
        Helpers.error(`App build only for ${config.frameworkName} ${chalk.bold(allowedLibs.join(','))} project types`, false, true)
      } else {
        Helpers.error(`Library build only for ${config.frameworkName} ${chalk.bold(allowedLibs.join(','))} project types`, false, true)
      }
    }
    //#endregion

    Helpers.log(`[db][checkBuildIfAllowed] started... `);
    const db = await TnpDB.Instance(config.dbLocation);
    const singularBuildInParent = await this.project.hasParentWithSingularBuild();

    await db.checkBuildIfAllowed(
      this.project as any,
      buildOptions,
      process.pid,
      process.ppid,
      true
    );
    Helpers.log(`[db][checkBuildIfAllowed] finish `);

    if (buildOptions.appBuild) { // TODO is this ok baw is not initing ?

      if (singularBuildInParent) {
        Helpers.info(`[build[ DETECTED SINGULAR in parent project: ${this.project.parent.name}`);
        await this.project.filesStructure.init(buildOptions.args, { watch: true });
      } else {
        if (this.project.node_modules.exist) {
          Helpers.log(`NODE MODULE EXISTS`)
        } else {
          await this.project.filesStructure.init(buildOptions.args);
        }
      }

      if (buildOptions.watch) {
        let config;
        while (true) {
          if (this.project.isWorkspace) {
            if (this.project.env.config) {
              config = this.project.env.config.workspace.workspace;
            }
          } else if (this.project.isWorkspaceChildProject) {
            if (this.project.env.config) {
              config = this.project.env.config.workspace.projects.find(({ name }) => name === this.project.name);
            }
          } else {
            break;
          }
          if (config) {
            break;
          } else {
            await this.project.filesStructure.init(buildOptions.args);
          }
        }
        if (this.project.isWorkspace || this.project.isWorkspaceChildProject) {
          await handleProjectsPorts(this.project, config, false);
        }
      }

    } else {
      if (buildOptions.watch) {
        if (this.project.isWorkspace) {
          Helpers.log(`Removing on purpose tmp-environment.json from wokspace, before init`);
          Helpers.remove(path.join(this.project.location, config.file.tnpEnvironment_json));
        }
        await this.project.filesStructure.init(buildOptions.args, { watch: true });
      } else {
        await this.project.filesStructure.init(buildOptions.args);
      }
    }

    //#region update environment data for "childs"
    if (this.project.isStandaloneProject || this.project.isWorkspaceChildProject) {
      await this.project.env.updateData();
      if (this.project.type === 'angular-lib') {
        this.project.filesTemplatesBuilder.rebuildFile('src/index.html.filetemplate');
      }
    }
    //#endregion

    //#region report initial progres
    if (!buildOptions.watch && this.project.isGenerated && this.project.isWorkspace) {
      PROGRESS_DATA.log({ value: 0, msg: `Static build initing` });
    }
    //#endregion

    await db.checkBuildIfAllowed(this.project as any, buildOptions, process.pid, process.ppid, false)

    //#region handle build clients projects
    if (this.project.isGenerated) {
      await selectClients(buildOptions, this.project, db);
    } else {
      if (buildOptions.appBuild) {
        if (!singularBuildInParent) {
          await waitForAppBuildToBePossible(db, this.project);
        }
      } else if (allowedForSelectingCLients.includes(this.project.type)) {

        await selectClients(buildOptions, this.project, db);
        await waitForRequiredDistsBuilds(db, this.project, buildOptions.forClient as any[]);
      }
    }
    //#endregion

    //#region report start building message
    Helpers.info(`\n\n\t${chalk.bold('Start of Building')} ${this.project.genericName} `
      + `(${buildOptions.appBuild ? 'app' : 'lib'})\n\n`);
    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg: `Start of building ${this.project.genericName}` })
    }
    //#endregion

    await this.project.build(buildOptions);

    //#region handle end of building
    const msg = (buildOptions.watch ? `
      Waching files.. started.. please wait...
    `: `
      End of Building ${this.project.genericName}

    ` )

    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg });
    } else {
      Helpers.info(msg);
    }
    if (exit && !buildOptions.watch) {
      Helpers.log('Build process exit')
      process.exit(0);
    }
    //#endregion
  }

}
