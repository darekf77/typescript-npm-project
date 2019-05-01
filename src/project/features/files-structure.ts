//#region @backend
import * as path from 'path';
import chalk from 'chalk';

import { clearConsole, log, error } from '../../helpers';
import { FeatureForProject, Project } from '../abstract';
import { TnpDB } from '../../tnp-db';
import config from '../../config';
import { OutFolder } from 'morphi/build';

export type CleanType = 'all' | 'only_static_generated'

export class FilesStructure extends FeatureForProject {


  public async initAndWatch(args: string) {
    if (this.project.isContainer) {
      error(`[initandwatch] cannot be done in container`)
    }
    return this.init(args, { watch: true })
  }

  public async init(args: string, options?: { watch: boolean }) {

    if (this.project.isContainer) {
      for (let index = 0; index < this.project.children.length; index++) {
        const containerChild = this.project.children[index];
        await containerChild.filesStructure.init(args, options);
      }
      return;
    }

    if (!options) {
      options = { watch: false };
    }

    const { watch } = options;
    const p = this.project;
    const db = await TnpDB.Instance;
    await db.transaction.addProjectIfNotExist(p)
    await this.initialize(args, p, watch);

  }

  private async  initialize(pArgs?: string, project = Project.Current, watch = false) {

    if (!project) {
      log(`No project to init inside: ${process.cwd()}`)
    }

    project.tnpBundle.installAsPackage()

    if (project.isWorkspaceChildProject && !project.parent.node_modules.exist) {
      project.parent.npmPackages.installAll(`initialize procedure of child ${project.genericName}`);
    } else if (!project.node_modules.exist) {
      project.npmPackages.installAll(`initialize procedure of ${project.name}`);
    }

    if (project.parent) {
      project.parent.recreate.init();// TODO QUICK IFX
    }

    project.recreate.init();

    if (project.isSite) {

      await this.installTnpHelpersForBaselines(project.baseline);
      await this.recreateFilesBaselinesWorkspaces(project);
      project.baseline.recreate.init();

      await this.joinSiteWithParentBaselines(project, watch);
    }

    if (!project.isStandaloneProject) {

      const initFromScratch = (!project.env.config || (project.isWorkspaceChildProject && !project.parent.env.config));

      await project.env.init(pArgs, !initFromScratch);

      if (!initFromScratch) {
        const projectName = project.parent ? `${project.parent.name}/${project.name}` : project.name

        console.log(`Config alredy ${chalk.bold('init')}ed tnp.
  ${chalk.green('Environment for')} ${project.isGenerated ? chalk.bold('(generated)') : ''} `
          + `${chalk.green(chalk.bold(projectName))}: ${chalk.bold(project.env.config.name)}`)
      }

    }

  }

  private async  joinSiteWithParentBaselines(project: Project, watch: boolean, projectsToRecreate: Project[] = []) {


    if (!project || !project.isSite) {
      // console.log(`(info joining) ${chalk.bold(project.name)} is not a site project`)

      for (let index = 0; index < projectsToRecreate.length; index++) {
        const p = projectsToRecreate[index];

        if (watch) {
          if (p.isWorkspaceChildProject) {
            (await p.parent.join.init()).watch()
          }
          (await p.join.init()).watch()
        } else {
          if (p.isWorkspaceChildProject) {
            (await p.parent.join).init()
          }
          await p.join.init()
        }
      }
      return;
    }
    projectsToRecreate.unshift(project);
    await this.joinSiteWithParentBaselines(project.baseline, watch, projectsToRecreate);
  }

  private async  recreateFilesBaselinesWorkspaces(project: Project, projectsToRecreate: Project[] = []) {

    if (!project || !project.isSite) {
      // console.log(`(info recreating) ${chalk.bold(project.name)} is not a site project`)

      for (let index = 0; index < projectsToRecreate.length; index++) {
        const p = projectsToRecreate[index];
        p.recreate.init()
      }
      return;
    }

    if (project.baseline.isWorkspaceChildProject) {
      projectsToRecreate.unshift(project.baseline.parent);
      await this.recreateFilesBaselinesWorkspaces(project.baseline.parent, projectsToRecreate)

    } else if (project.baseline.isWorkspace) {
      projectsToRecreate.unshift(project.baseline);
      await this.recreateFilesBaselinesWorkspaces(project.baseline, projectsToRecreate)
    }


  }

  private async  installTnpHelpersForBaselines(project: Project) {

    if (project.isSite) {
      // if (project.isWorkspaceChildProject) {
      //   project.parent.baseline.tnpHelper.install()
      // } else if (project.isWorkspace) {
      project.baseline.tnpBundle.installAsPackage()
      // }
    }

    if (project.isSite) {
      await this.installTnpHelpersForBaselines(project.baseline)
    }
  }

  private recrusiveOperation(proj: Project, recrusive = false, type: keyof Project) {
    if(type === 'clear') {
      proj.clear()
    } else if(type === 'reset') {
      proj.reset()
    }
    if (recrusive) {
      for (let index = 0; index < proj.children.length; index++) {
        const c = proj.children[index];
        this.recrusiveOperation(c, recrusive, type)
      }
    }
  }

  public async reset(options?: { recrusive: boolean; }) {
    const { recrusive = false } = options || {};
    this.recrusiveOperation(this.project, recrusive, 'reset')
  }

  public async clear(options?: { recrusive: boolean; }) {
    const { recrusive = false } = options || {};
    this.recrusiveOperation(this.project, recrusive, 'clear')
  }

  private resolveArgs(args: string) {
    let { recrusive = false, r = false } = require('minimist')(args.split(' '));
    recrusive = (recrusive || r);
    return { recrusive }
  }

  async resetFromArgs(args) {
    const { recrusive } = this.resolveArgs(args)
    await this.reset({ recrusive })
  }

  async  clearFromArgs(args) {
    const { recrusive } = this.resolveArgs(args)
    await this.clear({ recrusive })
  }

}






//#endregion
