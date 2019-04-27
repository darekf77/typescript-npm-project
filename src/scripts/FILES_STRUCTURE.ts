//#region @backend
import { Project } from "../project";
import { TnpDB } from '../tnp-db';
import { sleep } from 'sleep';


// init().project();
// init().watch.project()

export async function INIT(args, exit = true) {
  await Project.Current.structure.init(args);
  if (exit) {
    process.exit(0)
  }

}


export default {
  $CLEAN: async (args) => { await Project.Current.structure.clear(args) },
  $CLEAR: async (args) => { await Project.Current.structure.clear(args) },
  $CLEAN_ALL: async () => { await Project.Current.structure.clear('', true) },
  $CLEAR_ALL: async () => { await Project.Current.structure.clear('', true) },

  INIT,
  $REINIT: (args) => {
    Project.Current.run(`tnp clear`).sync()
    Project.Current.run(`tnp init`).sync()
    process.exit(0)
  },

  $VSCODE_FIX: async () => {
    const db = await TnpDB.Instance;
    const projects = db.getProjects();
    for (let index = 0; index < projects.length; index++) {
      const proj = projects[index];
      proj.project.recreate.vscode.settings.changeColorTheme(false)
    }
    sleep(1);
    for (let index = 0; index < projects.length; index++) {
      const proj = projects[index];
      proj.project.recreate.vscode.settings.changeColorTheme()
    }
    sleep(1);
    for (let index = 0; index < projects.length; index++) {
      const proj = projects[index];
      proj.project.recreate.vscode.settings.gitReset()
    }
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
