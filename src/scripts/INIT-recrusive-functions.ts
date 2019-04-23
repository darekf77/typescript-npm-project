//#region @backend
import { Project } from "../project";


export namespace RecrusiveBaseline {

  export async function joinSiteWithParentBaselines(project: Project, watch: boolean, projectsToRecreate: Project[] = []) {


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
      // if (project.isWorkspaceChildProject) {
      //   project.parent.baseline.tnpHelper.install()
      // } else if (project.isWorkspace) {
      project.baseline.tnpHelper.install()
      // }
    }

    if (project.isSite) {
      await installTnpHelpersForBaselines(project.baseline)
    }
  }

}

//#endregion
