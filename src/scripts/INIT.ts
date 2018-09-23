//#region @backend
import { Project } from "../project";
import { run } from '../process';
import { error } from '../messages';


export async function init(args, project = Project.Current) {
  project.recreate.init();

  if (project.isSite) {
    project.baseline.recreate.init()
  }

  if (project.isWorkspace) {
    await project.env.init(args)
  }

}

export default {
  $INIT: async (args) => {

    await init(args)

    process.exit(0)
  },


  $VSCODE: () => {
    Project.Current.recreate.vscode.settings.excludedFiles();
    Project.Current.recreate.vscode.settings.colorsFromWorkspace()
    process.exit(0)
  },
  $INIT_VSCODE: () => {
    Project.Current.recreate.vscode.settings.excludedFiles();
    Project.Current.recreate.vscode.settings.colorsFromWorkspace()
    process.exit(0)
  },
  $INIT_EVERYWHERE: (args) => {
    Project.projects.forEach(p => {
      p.run(`tnp init`).sync()
    })
  }
}
//#endregion
