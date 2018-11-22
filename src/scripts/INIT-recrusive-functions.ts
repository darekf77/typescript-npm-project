//#region @backend
import { Project } from "../project";
import { run } from '../process';
import { error } from '../messages';
import chalk from 'chalk';
import { install } from './INSTALL';

export namespace RecrusiveBaseline {

  export async function joinSiteWithParentBaselines(project: Project, watch: boolean, projectsToRecreate: Project[] = []) {


    if (!project || !project.isSite) {
      // console.log(`(info joining) ${chalk.bold(project.name)} is not a site project`)

      for (let index = 0; index < projectsToRecreate.length; index++) {
        const p = projectsToRecreate[index];

        if (watch) {
          p.join.init().watch()
          if (p.isWorkspaceChildProject) {
            p.parent.join.init().watch()
          }
        } else {
          p.join.init()
          if (p.isWorkspaceChildProject) {
            p.parent.join.init()
          }
        }
      }
      return
    }
    projectsToRecreate.unshift(project);
    await joinSiteWithParentBaselines(project.baseline, watch, projectsToRecreate);
  }


  export async function recreateFilesBaselinesWorkspaces(project: Project, projectsToRecreate: Project[] = []) {

    if (!project || !project.isSite) {
      // console.log(`(info recreating) ${chalk.bold(project.name)} is not a site project`)

      for (let index = 0; index < projectsToRecreate.length; index++) {
        const p = projectsToRecreate[index];
        p.recreate.init()
      }
      return
    }

    if (project.baseline.isWorkspaceChildProject) {
      projectsToRecreate.unshift(project.baseline.parent);
      await recreateFilesBaselinesWorkspaces(project.baseline.parent, projectsToRecreate)

    } else if (project.baseline.isWorkspace) {
      projectsToRecreate.unshift(project.baseline);
      await recreateFilesBaselinesWorkspaces(project.baseline, projectsToRecreate)
    }


  }

  export async function installTnpHelpersForBaselines(project: Project) {

    if (project.isSite) {
      if (project.isWorkspaceChildProject) {
        project.parent.baseline.tnpHelper.install()
      } else if (project.isWorkspace) {
        project.baseline.tnpHelper.install()
      }
    }

    if (project.isSite) {
      await installTnpHelpersForBaselines(project.baseline)
    }
  }

}

//#endregion
