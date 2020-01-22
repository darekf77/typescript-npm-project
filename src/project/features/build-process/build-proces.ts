//#region @backend
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

export class BuildProcess extends FeatureForProject {

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

  private mergeNpmPorject() {
    // console.log(this.project.parent.getAllChildren({ unknowIncluded: true }))

    if (this.project.isWorkspaceChildProject) {
      // Helpers.log(`[mergeNpmPorject] started.. for ${this.project.genericName}`)
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
      // Helpers.log(`[mergeNpmPorject] finish..`)
    }

  }

  private get checkIfGeneratedTnpBundle() {
    return Project.Current.isTnp ? true : fse.existsSync(path.join(Project.Tnp.location, global.tnp_out_folder, config.folder.browser))
  }

  private async  build(buildOptions: BuildOptions, allowedLibs: Models.libs.LibType[], exit = true) {
    this.project.buildOptions = buildOptions;

    if (this.project.isGenerated && buildOptions.watch) {
      buildOptions.watch = false;
      Helpers.warn(`You cannot build static project in watch mode. Change to build mode: watch=false`);
    }

    if (!this.project.isStandaloneProject && !this.checkIfGeneratedTnpBundle) {
      Helpers.error(`Please compile your tsc-npm-project to tnp-bundle`, false, true)
    }

    if (this.project.isWorkspace && !buildOptions.appBuild && buildOptions.watch) {
      Helpers.error(`Build watch only for workspace childs`, false, true)
    }

    // if (this.project.isGenerated) {
    //   this.project.reset();
    // }

    this.mergeNpmPorject();

    if (_.isArray(allowedLibs) && !allowedLibs.includes(this.project.type)) {
      if (buildOptions.appBuild) {
        Helpers.error(`App build only for ${config.frameworkName} ${chalk.bold(allowedLibs.join(','))} project types`, false, true)
      } else {
        Helpers.error(`Library build only for ${config.frameworkName} ${chalk.bold(allowedLibs.join(','))} project types`, false, true)
      }
    }

    // Helpers.log(`[db][checkBuildIfAllowed] started... `);
    const db = await TnpDB.Instance(config.dbLocation);
    await db.transaction.checkBuildIfAllowed(
      this.project as any,
      buildOptions,
      process.pid,
      process.ppid,
      true
    );
    // Helpers.log(`[db][checkBuildIfAllowed] finish `);

    if (buildOptions.appBuild) { // TODO is this ok baw is not initing ?

      if (this.project.node_modules.exist) {
        Helpers.log(`NODE MODULE EXISTS`)
      } else {
        await this.project.filesStructure.init(buildOptions.args);
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
        await this.project.filesStructure.init(buildOptions.args, { watch: true });
      } else {
        await this.project.filesStructure.init(buildOptions.args);
      }
    }

    if (this.project.isStandaloneProject || this.project.isWorkspaceChildProject) {
      await this.project.env.updateData();
      if (this.project.type === 'angular-lib') {
        this.project.filesTemplatesBuilder.rebuildFile('src/index.html.filetemplate');
      }
    }


    if (!buildOptions.watch && this.project.isGenerated && this.project.isWorkspace) {
      PROGRESS_DATA.log({ value: 0, msg: `Static build initing` });
    }

    await db.transaction.checkBuildIfAllowed(this.project as any, buildOptions, process.pid, process.ppid, false)

    const allowedForSelectingCLients = [
      'angular-lib',
      'isomorphic-lib',
      'angular-client',
      'ionic-client',
    ] as Models.libs.LibType[];

    if (this.project.isGenerated) {
      await selectClients(buildOptions, this.project, db);
    } else {
      if (buildOptions.appBuild) {
        await waitForAppBuildToBePossible(db, this.project);
      } else if (allowedForSelectingCLients.includes(this.project.type)) {

        await selectClients(buildOptions, this.project, db);
        await waitForRequiredDistsBuilds(db, this.project, buildOptions.forClient as any[]);
      }
    }


    Helpers.log(`

    ${chalk.bold('Start of Building')} ${this.project.genericName} (${buildOptions.appBuild ? 'app' : 'lib'})

    `);
    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg: `Start of building ${this.project.genericName}` })
    }
    await this.project.build(buildOptions);
    const msg = (buildOptions.watch ? `
      Waching files.. started.. please wait...
    `: `
      End of Building ${this.project.genericName}

    ` )

    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg });
    } else {
      Helpers.log(msg);
    }
    if (exit && !buildOptions.watch) {
      Helpers.log('Build process exit')
      process.exit(0);
    }
  }

}

//#endregion
