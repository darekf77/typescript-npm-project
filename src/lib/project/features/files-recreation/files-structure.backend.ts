//#region imports
import { path } from 'tnp-core'
import { _ } from 'tnp-core';
import chalk from 'chalk';
import { fse } from 'tnp-core';
import { Helpers, FiredevModels } from 'tnp-helpers';
import { FeatureForProject, Project } from '../../abstract';
import { BuildOptions, TnpDB } from 'tnp-db';
import { config } from 'tnp-config';
import { ProjectFactory } from '../../../scripts/NEW-PROJECT_FILES_MODULES';
import { PROGRESS_DATA } from 'tnp-models';
import { Models } from 'tnp-models';
import { EnvironmentConfig } from '../environment-config';
import { CLASS } from 'typescript-class-helpers';
import type { ProjectContainer } from '../../project-specyfic/project-container';
//#endregion

export class FilesStructure extends FeatureForProject {
  //#region fields & getters

  //#region fields & getters / tasks names
  private get taskNames() {
    return {
      sourceModifir: `[filestructure] (${chalk.bold(this.project.genericName)
        }) Client source modules pathes modifier `,
      frameworkFileGenerator: `[filestructure] (${chalk.bold(this.project.genericName)
        }) Files generator: entites.ts, controllers.ts`,
      joinMerge: `[filestructure] Join project ${this.project.genericName}`,
    };
  }
  //#endregion

  //#endregion

  //#region api

  //#region api / init
  public async init(buildOptions: BuildOptions<Project>) {
    //#region resolve variables

    buildOptions = this.fixOptionsArgs(buildOptions);

    if (!buildOptions.initiator) {
      buildOptions.initiator = this.project;
    }
    const { alreadyInitedPorjects, watch, watchOnly,
      websql, recrusive, skipSmartContainerDistBundleInit, client, clientArgString
    } = buildOptions;

    // THIS IS SLOW... BUT I CAN AFORD IT HERE
    if (!_.isUndefined(alreadyInitedPorjects.find(p => p.location === this.project.location))) {
      this.project.quickFixes.missingSourceFolders();
      if (this.project.isStandaloneProject && this.project.packageJson) {
        this.project.packageJson.updateHooks()
      }
      this.project.notAllowedFiles().forEach(f => {
        // Helpers.log(`[init] removing not allowed ${ path.basename(f) } `)
        Helpers.removeFileIfExists(path.join(this.project.location, f));
      });
    }

    //#endregion

    await this.project.linkedRepos.update();


    Helpers.log(`[init] adding project is not exists... (${this.project.genericName})`)
    const db = await TnpDB.Instance();
    // Helpers.log(`[init] db initined... `)
    await db.addProjectIfNotExist(this.project as any);
    Helpers.log(`[init] adding project is not exists...done(${this.project.genericName})  `)

    if (!_.isUndefined(alreadyInitedPorjects.find(p => p.location === this.project.location))) {
      Helpers.log(`Already inited project: ${chalk.bold(this.project.genericName)} - skip`);
      return;
    } else {
      Helpers.log(`Not inited yet... ${chalk.bold(this.project.genericName)} in ${this.project.location} `);
    }

    this.project.quickFixes.missingSourceFolders();
    this.project.quickFixes.linkSourceOfItselfToNodeModules();
    this.project.quickFixes.missingAngularLibFiles();

    if (this.project.isTnp) { // TODO make it for standalone
      this.project.quickFixes.overritenBadNpmPackages();

    }
    if (this.project.isStandaloneProject || this.project.isContainer) {
      this.project.quickFixes.missingLibs(config.quickFixes.missingLibs)
    }

    if (this.project.isStandaloneProject) {
      Helpers.info(`Initing project: ${chalk.bold(this.project.genericName)}  ${this.project.location} ${websql ? '[WEBSQL]' : ''} `);
    }

    alreadyInitedPorjects.push(this.project)
    Helpers.log(`Push to alread inited ${this.project.genericName} from ${this.project.location} `)

    //#region handle init of container
    if (this.project.isContainer) {
      await this.project.recreate.init(buildOptions);

      if (!this.project.isContainerOrWorkspaceWithLinkedProjects) {
        const containerChildren = this.project.children.filter(c => {
          Helpers.log('checking if git repo')
          if (c.git.isGitRepo) {
            Helpers.log(`[init] not initing recrusively, it is git repo ${c.name} `)
            return false;
          }
          Helpers.log('checking if git repo - done')
          return true;
        })
        for (let index = 0; index < containerChildren.length; index++) {
          const containerChild = containerChildren[index];
          await containerChild.filesStructure.init(buildOptions);
          for (let indexChild = 0; indexChild < containerChild.children.length; indexChild++) {
            const workspaceChild = containerChild.children[indexChild];
            await workspaceChild.filesStructure.init(buildOptions)
          }
        }
      }

    }
    //#endregion


    //#region report progress initing project
    if (global.tnpNonInteractive) {
      PROGRESS_DATA.log({ msg: `Initing project: "${this.project.genericName}" started` });
    }
    //#endregion

    if (!this.project.isContainer) {
      await this.project.recreate.init(buildOptions);
    }
    this.project.recreate.vscode.settings.hideOrShowDeps();

    if (this.project.isStandaloneProject) {
      if (_.isNil(this.project.buildOptions)) { // TODO QUICK_FIX
        this.project.buildOptions = {} as any;
      }
      await (this.project.env as any as EnvironmentConfig).init(buildOptions);
      this.project.filesTemplatesBuilder.rebuild();
    }

    //#region handle node modules instalation

    if (!this.project.node_modules.exist) {
      await this.project.npmPackages.installProcess(`initialize procedure of ${this.project.name} `);
    } else {
      if (this.project.isStandaloneProject && this.project.frameworkVersionAtLeast('v2')) {
        this.project.packageJson.showDeps(`Show new deps for ${this.project._frameworkVersion} `);
      }
    }

    if (this.project.isContainerCoreProject && this.project.frameworkVersionEquals('v1')) {
      this.project.quickFixes.overritenBadNpmPackages();
    }
    //#endregion

    const ProjectContainerClass = CLASS.getBy('ProjectContainer') as typeof ProjectContainer;
    ProjectContainerClass.handleSmartContainer(this.project, clientArgString);


    if (this.project.isSmartContainer && !skipSmartContainerDistBundleInit) {
      //#region handle smart container
      Helpers.writeFile([this.project.location, 'angular.json'], this.project.recreate.angularJsonContainer);
      await this.project.singluarBuild.init(buildOptions);
      //#endregion
    }

    this.project.quickFixes.missingSourceFolders();
    this.project.quickFixes.badTypesInNodeModules();

    if (!this.project.isVscodeExtension) {
      if (this.project.isWorkspaceChildProject || this.project.isStandaloneProject) {
        if (watch) {
          await this.project.frameworkFileGenerator.startAndWatch(this.taskNames.frameworkFileGenerator, {
            watchOnly, afterInitCallBack: async () => {
              await this.project.compilerCache.setUpdatoDate.frameworkFileGenerator();
            }
          });
          // if (!this.project) {
          //   console.trace('HERE')
          // }
          await this.project.sourceModifier.startAndWatch(this.taskNames.sourceModifir, {
            watchOnly, afterInitCallBack: async () => {
              await this.project.compilerCache.setUpdatoDate.sourceModifier();
            }
          });
        } else {
          await this.project.frameworkFileGenerator.start(this.taskNames.frameworkFileGenerator);
          // if (!this.project) {
          //   console.trace('HERE')
          // }
          await this.project.sourceModifier.start(this.taskNames.sourceModifir);
        }
        // process.exit(0)
      }
    }
    Helpers.log(`Init DONE for project: ${chalk.bold(this.project.genericName)} `);
  }
  //#endregion

  //#region api / reset
  public async reset(options?: { recrusive: boolean; }) {
    let { recrusive = false } = options || {};
    if (this.project.isSmartContainer) {
      recrusive = true;
    }
    await this.recrusiveOperation(this.project, recrusive, 'reset')
  }
  //#endregion

  //#region api / clear
  public async clear(options?: { recrusive: boolean; }) {
    let { recrusive = false } = options || {};
    if (this.project.isSmartContainer) {
      recrusive = true;
    }
    await this.recrusiveOperation(this.project, recrusive, 'clear')
  }
  //#endregion

  //#endregion

  //#region methods

  //#region methods /  fix args
  private fixOptionsArgs(options: BuildOptions<Project>) {
    if (_.isUndefined(options)) {
      options = {} as any;
    }
    if (_.isUndefined(options.alreadyInitedPorjects)) {
      options.alreadyInitedPorjects = [];
    }
    if (_.isUndefined(options.watch)) {
      options.watch = false;
    }
    // if (_.isUndefined(options.initiator)) {
    //   options.initiator = this.project;
    // }
    return options;
  }
  //#endregion

  //#region methods /  recrusve optration
  private async recrusiveOperation(proj: Project, recrusive = false, type: keyof Project) {

    if (type === 'clear') {
      await proj.clear()
    } else if (type === 'reset') {
      await proj.reset()
    }
    if (recrusive) {
      for (let index = 0; index < proj.children.length; index++) {
        const c = proj.children[index];
        await this.recrusiveOperation(c, recrusive, type)
      }
    }
  }
  //#endregion

  //#region methods / resolve args
  private resolveArgs(args: string) {
    let { recrusive = false, r = false } = require('minimist')(args.split(' '));
    recrusive = (recrusive || r);
    return { recrusive }
  }
  //#endregion

  //#region methods / reset from args
  async resetFromArgs(args) {
    const { recrusive } = this.resolveArgs(args)
    await this.reset({ recrusive })
  }
  //#endregion

  //#region methods / clear from args
  async clearFromArgs(args) {
    const { recrusive } = this.resolveArgs(args);
    if (this.project.npmPackages.useSmartInstall) {
      await this.clear({ recrusive });
    } else {
      await Helpers.questionYesNo(`Do you wanna delete node_modules and reset ${recrusive ? 'project(s) recursively' : 'project(s)'} ?`, async () => {
        await this.clear({ recrusive });
      });
    }
  }
  //#endregion

  //#endregion



}
