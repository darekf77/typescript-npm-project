import { _ } from 'tnp-core/src';
import chalk from 'chalk';
import { Helpers } from 'tnp-helpers/src';
import { Project } from '../../abstract/project';
import { InitOptions } from '../../../build-options';
import { BaseFeatureForProject } from 'tnp-helpers/src';

export type CleanType = 'all' | 'only_static_generated';


export class FilesStructure extends BaseFeatureForProject<Project> {

  public async init(options?: InitOptions) {
    options = InitOptions.from(options);

    if (!options.initiator) {
      options.initiator = this.project;
    }
    const { alreadyInitedPorjects, watch, smartContainerTargetName, struct, branding, websql } = options;

    // THIS IS SLOW... BUT I CAN AFORD IT HERE
    if (!_.isUndefined(alreadyInitedPorjects.find(p => p.location === this.project.location))) {
      this.project.quickFixes.missingSourceFolders();
      if (this.project.__isStandaloneProject && this.project.__packageJson) {
        this.project.__packageJson.updateHooks()
      }
    }

    await this.project.__linkedRepos.update(struct);

    Helpers.log(`[init] adding project is not exists...done(${this.project.genericName})  `)

    if (!_.isUndefined(alreadyInitedPorjects.find(p => p.location === this.project.location))) {
      Helpers.log(`Already inited project: ${chalk.bold(this.project.genericName)} - skip`);
      return;
    } else {
      Helpers.log(`Not inited yet... ${chalk.bold(this.project.genericName)} in ${this.project.location} `);
    }

    this.project.quickFixes.missingSourceFolders();

    if (this.project.__isSmartContainer) {
      const children = this.project.children;
      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        if (child.__frameworkVersion !== this.project.__frameworkVersion) {
          await child.__setFramworkVersion(this.project.__frameworkVersion);
        }
      }
    }

    if (this.project.__isStandaloneProject || this.project.__isSmartContainerChild) {
      await this.project.__branding.apply(!!branding);
    }

    this.project.quickFixes.missingAngularLibFiles();
    if (this.project.__isTnp) { // TODO make it for standalone
      this.project.quickFixes.overritenBadNpmPackages();

    }
    if (this.project.__isStandaloneProject || this.project.__isContainer) {
      this.project.quickFixes.missingLibs([])
    }

    if (this.project.__isStandaloneProject) {

      Helpers.taskStarted(`Initing project: ${chalk.bold(this.project.genericName)}`);
      Helpers.log(` (from locaiton: ${this.project.location})`);
      Helpers.log(`Init mode: ${websql ? '[WEBSQL]' : ''}`)
    }

    alreadyInitedPorjects.push(this.project)
    Helpers.log(`Push to alread inited ${this.project.genericName} from ${this.project.location} `)

    //#region handle init of container
    if (this.project.__isContainer) {
      await this.project.__recreate.init();

      if (!this.project.__isContainerWithLinkedProjects) {
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
          await containerChild.__filesStructure.init(options);
          const containerChildChildren = containerChild.children;
          for (let indexChild = 0; indexChild < containerChildChildren.length; indexChild++) {
            const workspaceChild = containerChildChildren[indexChild];
            await workspaceChild.__filesStructure.init(options)
          }
        }
      }

    }
    //#endregion

    await this.project.__recreate.init();
    this.project.__recreate.vscode.settings.toogleHideOrShowDeps();

    if (this.project.__isStandaloneProject || this.project.__isSmartContainer) {
      await this.project.__env.init();
      this.project.__filesTemplatesBuilder.rebuild();
    }

    if (!this.project.__node_modules.exist && !struct) {
      await this.project.__npmPackages.installProcess(`inti procedure of ${this.project.name} `);
    }
    this.project.__packageJson.showDeps(`Show new deps for ${this.project.__frameworkVersion} `);
    //#region handle node modules instalation
    if (!this.project.__isDocker) {
      if (this.project.__isContainerCoreProject && this.project.__frameworkVersionEquals('v1')) {
        this.project.quickFixes.overritenBadNpmPackages();
      }
    }
    //#endregion
    if (this.project.__isSmartContainer) {
      //#region handle smart container

      await this.project.__recreate.init();
      await this.project.__singluarBuild.init(watch, false, 'dist', smartContainerTargetName);
      //#endregion
    }

    this.project.quickFixes.missingSourceFolders();

    this.project.quickFixes.badTypesInNodeModules();
    Helpers.log(`Init DONE for project: ${chalk.bold(this.project.genericName)} `);
  }


}
