//#region @backend
import { Project } from "../project";
import { TnpDB } from '../tnp-db';
import { sleep } from 'sleep';


// init().project();
// init().watch.project()

export default {
  CLEAN: async (args) => {
    await Project.Current.filesStructure.clearFromArgs(args)
    process.exit(0)
  },
  CLEAR: async (args) => {
    await Project.Current.filesStructure.clearFromArgs(args)
    process.exit(0)
  },
  STATIC_CLEAN: async (args) => {
    await Project.Current.StaticVersion.filesStructure.clearFromArgs(args)
    process.exit(0)
  },
  STATIC_CLEAR: async (args) => {
    await Project.Current.StaticVersion.filesStructure.clearFromArgs(args)
    process.exit(0)
  },

  CLEAN_ALL: async (args) => {
    await Project.Current.filesStructure.clear({ recrusive: true })
    process.exit(0)
  },
  CLEAR_ALL: async (args) => {
    await Project.Current.filesStructure.clear({ recrusive: true })
    process.exit(0)
  },

  STATIC_CLEAN_ALL: async (args) => {
    await Project.Current.StaticVersion.filesStructure.clear({ recrusive: true })
    process.exit(0)
  },
  STATIC_CLEAR_ALL: async (args) => {
    await Project.Current.StaticVersion.filesStructure.clear({ recrusive: true })
    process.exit(0)
  },

  async RESET(args) {
    await Project.Current.filesStructure.resetFromArgs(args)
    process.exit(0)
  },

  async RESET_ALL() {
    await Project.Current.filesStructure.reset({ recrusive: true })
    process.exit(0)
  },

  async STATIC_RESET(args) {
    await Project.Current.StaticVersion.filesStructure.resetFromArgs(args)
    process.exit(0)
  },

  async STATIC_RESET_ALL() {
    await Project.Current.StaticVersion.filesStructure.reset({ recrusive: true })
    process.exit(0)
  },

  async  INIT(args) {
    await Project.Current.filesStructure.init(args);
    process.exit(0)
  },
  async  STATIC_INIT(args) {
    await Project.Current.StaticVersion.filesStructure.init(args);
    process.exit(0);
  },


  $VSCODE_FIX: async () => {
    const db = await TnpDB.Instance;
    const projects = db.getProjects();
    for (let index = 0; index < projects.length; index++) {
      const proj = projects[index];
      proj.project &&  proj.project.recreate.vscode.settings.changeColorTheme(false)
    }
    sleep(1);
    for (let index = 0; index < projects.length; index++) {
      const proj = projects[index];
      proj.project && proj.project.recreate.vscode.settings.changeColorTheme()
    }
    sleep(1);
    for (let index = 0; index < projects.length; index++) {
      const proj = projects[index];
      proj.project &&  proj.project.recreate.vscode.settings.gitReset()
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
