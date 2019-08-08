//#region @backend
import { Project } from '../project';
import { error } from '../helpers';

export async function INSTALL(args, exit = true) {
  await Project.Current.npmPackages.installFromArgs(args);
  if (exit) {
    process.exit(0);
  }
}

export async function UNINSTALL(args, exit = true) {
  await Project.Current.npmPackages.uninstallFromArgs(args);
  if (exit) {
    process.exit(0);
  }
}

export default {
  INSTALL,
  UNINSTALL,
  $I: (args) => {
    INSTALL(args);
    process.exit(0);
  },
  async  LINK() {
    let project = Project.Current;
    if (project.isWorkspaceChildProject) {
      project = project.parent;
    }
    if (!project.isWorkspace) {
      error(`This is not workspace or workpace child projct`, false, true)
    }
    project.workspaceSymlinks.add(`Add workspace symlinks`);
    process.exit(0)
  },
  async  UNLINK() {
    let project = Project.Current;
    if (project.isWorkspaceChildProject) {
      project = project.parent;
    }
    if (!project.isWorkspace) {
      error(`This is not workspace or workpace child projct`, false, true)
    }
    project.workspaceSymlinks.remove(`Remove workspace symlinks`);
    process.exit(0)
  }

}
//#endregion
