//#region @backend
import { Project } from "../project";
import { run } from '../process';


export function init(project = Project.Current) {
  project.recreate.init();
  if (project.isSite) {
    project.baseline.recreate.init()
    project.join.init()
  }

}

export default {
  $INIT: (args) => {
    init()
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
