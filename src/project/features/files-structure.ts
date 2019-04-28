//#region @backend
import * as path from 'path';
import chalk from 'chalk';

import { clearConsole, log } from '../../helpers';
import { FeatureForProject, Project } from '../abstract';
import { TnpDB } from '../../tnp-db';
import config from '../../config';

export class FilesStructure extends FeatureForProject {


  public async initAndWatch(args: string) {

    return this.init(args, { watch: true })
  }

  public async init(args: string,
    options?: { watch: boolean }) {

    if (!options) {
      options = { watch: false };
    }

    const { watch } = options;
    const p = this.project;
    const db = await TnpDB.Instance;
    await db.transaction.addProjectIfNotExist(p)
    await this.initialize(args, p, watch);

  }

  private async  initialize(
    pArgs?: string,
    project = Project.Current, watch = false) {

    if (!project) {
      console.log(`No project to init inside: ${process.cwd()}`, false, true)
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


  private clearGenerated(all, recrusive, outDir: string) {
    const project: Project = this.project;
    log(`Cleaning generated workspace in for ${project.location}`)
    if (project.isWorkspace) {
      const genWorkspace = Project.From(path.join(project.location, outDir, project.name))
      if (genWorkspace) {
        genWorkspace.clear(all, recrusive);
      }
    } else if (project.isWorkspaceChildProject) {
      const genWorkspaceChild = Project.From(path.join(project.parent.location, outDir, project.parent.name, project.name))
      if (genWorkspaceChild) {
        genWorkspaceChild.clear(all, recrusive)
      }
    }

  }



  async  clear(args, all = false) {


    let { recrusive = false, r = false, generated = false, g = false } = require('minimist')(args.split(' '));
    recrusive = (recrusive || r || all);
    generated = (generated || g);

    if (all) {
      this.project.node_modules.remove()
    }



    if (this.project.isContainer) {
      // console.log('container childs',this.project.children.map( c => c.genericName ))
      // process.exit(0)

      if (recrusive) {
        for (let index = 0; index < this.project.children.length; index++) {
          const c = this.project.children[index];
          await c.structure.clear(args, all)
        }
      }
      return;
    }

    if (this.project.isWorkspace) {

      return
    }


    let project = this.project;
    if (all && project.isWorkspaceChildProject) {
      project = project.parent;
    }

    // const db = await TnpDB.Instance;
    // await (db).transaction.addProjectIfNotExist(project);
    // db.transaction.setCommand('tnp clear')

    if (generated) {
      this.clearGenerated(all, recrusive, config.folder.dist)
      // clearGenerated(project, all, recrusive, config.folder.bundle)
    } else {
      project.clear(all, recrusive)
    }

    process.exit(0)
  }

}

//#endregion
