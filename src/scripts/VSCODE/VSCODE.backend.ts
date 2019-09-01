import { Helpers } from '../../helpers';
import * as path from 'path';
import { config } from '../../config';
import { TnpDB } from '../../tnp-db';
import { sleep } from 'sleep';
import { Project } from '../../project/abstract/project';
export function $VSCODE_EXT(args: string, exit = true) {
  Helpers.run(`npm install && npm-run tsc && npm run build:install`, {
    cwd: config.pathes.tnp_vscode_ext_location,
    output: true
  }).sync();
  exit && process.exit(0)
}

export function $VSCODE_TEMP_SHOW(args: string, exit = true) {
  Project.Current.recreate.vscode.settings.excludedFiles(false);
  Project.Current.recreate.vscode.settings.colorsFromWorkspace()
  console.log('proce cwd', process.cwd())
  exit && process.exit(0)
}

export function $VSCODE_TEMP_HIDE(args: string, exit = true) {
  Project.Current.recreate.vscode.settings.excludedFiles(true);
  Project.Current.recreate.vscode.settings.colorsFromWorkspace()
  console.log('proce cwd', process.cwd())
  exit && process.exit(0)
}

export function $INIT_VSCODE() {
  Project.Current.recreate.vscode.settings.excludedFiles();
  Project.Current.recreate.vscode.settings.colorsFromWorkspace()
  process.exit(0)
};

export async function $VSCODE_INIT_ALL() {
  const db = await TnpDB.Instance;
  const projects = db.getProjects();
  for (let index = 0; index < projects.length; index++) {
    const proj = projects[index];
    proj.project.recreate.vscode.settings.excludedFiles();
    proj.project.recreate.vscode.settings.colorsFromWorkspace()
  }
  process.exit(0);
}


export default {
  $VSCODE_EXT,
  $VSCODE_TEMP_SHOW,
  $VSCODE_TEMP_HIDE,
  $INIT_VSCODE,
  $VSCODE() {
    $INIT_VSCODE();
  },
  $VSCODE_INIT() {
    $INIT_VSCODE();
  },
  $VSCODE_INIT_ALL,
  async $INIT_ALL_VSCODE() {
    await $VSCODE_INIT_ALL();
  },
  async PROJECT_KILL_ALL() {
    let command: string;
    if (process.platform === 'darwin') {
      command = `kill -9 $(pgrep "Code Helper") && kill -9 $(pgrep "Code")`;
    }
    // run(`kill§ `).sync()
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




}
