//#region @backend
import { Project } from "../project";
import { TnpDB } from '../tnp-db';
import { sleep } from 'sleep';

export async function INIT(args: string, exit = true) {
  await Project.Current.filesStructure.init(args);
  if (exit) {
    process.exit(0)
  }

}

// export async function INIT_ALL(args: string, exit = true) {

//   await Project.Current.filesStructure.init(args);
//   if (Project.Current.isWorkspace || Project.Current.isContainer) {
//     for (let index1 = 0; index1 < Project.Current.children.length; index1++) {
//       const child1 = Project.Current.children[index1];
//       await child1.filesStructure.init(args);
//       for (let index2 = 0; index2 < child1.children.length; index2++) {
//         const child2 = child1.children[index2];
//         await child2.filesStructure.init(args);
//       }
//     }
//   }

//   if (exit) {
//     process.exit(0)
//   }

// }

export async function STATIC_INIT(args: string, exit = true) {
  await Project.Current.StaticVersion().filesStructure.init(args);
  if (exit) {
    process.exit(0)
  }
}

export async function CLEAN(args: string, exit = true) {
  await Project.Current.filesStructure.clearFromArgs(args)
  if (exit) {
    process.exit(0);
  }
}

export const CLEAR = CLEAN;

export async function STATIC_CLEAN(args: string, exit = true) {
  await Project.Current.StaticVersion(false).filesStructure.clearFromArgs(args)
  if (exit) {
    process.exit(0);
  }
}

export const STATIC_CLEAR = STATIC_CLEAN;

export async function CLEAN_ALL(args: string, exit = true) {
  await Project.Current.filesStructure.clear({ recrusive: true })
  if (exit) {
    process.exit(0);
  }
}

export const CLEAR_ALL = CLEAN_ALL;

export async function STATIC_CLEAN_ALL(args: string, exit = true) {
  await Project.Current.StaticVersion(false).filesStructure.clear({ recrusive: true })
  if (exit) {
    process.exit(0);
  }
}

export const STATIC_CLEAR_ALL = STATIC_CLEAN_ALL;

export async function RESET(args: string, exit = true) {
  await Project.Current.filesStructure.resetFromArgs(args)
  if (exit) {
    process.exit(0);
  }
}

export async function RESET_ALL(args: string, exit = true) {
  await Project.Current.filesStructure.reset({ recrusive: true })
  if (exit) {
    process.exit(0);
  }
}

export async function STATIC_RESET(args: string, exit = true) {
  await Project.Current.StaticVersion(false).filesStructure.resetFromArgs(args)
  if (exit) {
    process.exit(0);
  }
}

export async function STATIC_RESET_ALL(args: string, exit = true) {
  await Project.Current.StaticVersion(false).filesStructure.reset({ recrusive: true })
  if (exit) {
    process.exit(0);
  }
}



// init().project();
// init().watch.project()

export default {
  INIT,
  STATIC_INIT,
  CLEAN,
  CLEAR,
  STATIC_CLEAN,
  STATIC_CLEAR,
  CLEAN_ALL,
  CLEAR_ALL,
  STATIC_CLEAN_ALL,
  STATIC_CLEAR_ALL,
  RESET,
  RESET_ALL,
  STATIC_RESET,
  STATIC_RESET_ALL,

  TEMPLATES_BUILDER() {
    Project.Current.filesTemplatesBuilder.rebuild();
    process.exit(0)
  },

  $VSCODE_FIX: async () => {
    const db = await TnpDB.Instance;
    const projects = db.getProjects();
    for (let index = 0; index < projects.length; index++) {
      const proj = projects[index];
      proj.project && proj.project.recreate.vscode.settings.changeColorTheme(false)
    }
    sleep(1);
    for (let index = 0; index < projects.length; index++) {
      const proj = projects[index];
      proj.project && proj.project.recreate.vscode.settings.changeColorTheme()
    }
    sleep(1);
    for (let index = 0; index < projects.length; index++) {
      const proj = projects[index];
      proj.project && proj.project.recreate.vscode.settings.gitReset()
    }
    process.exit(0)
  },

  async VSCODEALL() {
    const db = await TnpDB.Instance;
    const projects = db.getProjects();
    for (let index = 0; index < projects.length; index++) {
      const proj = projects[index];
      proj.project.recreate.vscode.settings.excludedFiles();
      proj.project.recreate.vscode.settings.colorsFromWorkspace()
    }
    process.exit(0)
  },
  VSCODE: () => {
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
