import { Helpers } from '../../helpers';
import * as path from 'path';
import { config } from '../../config';
import { TnpDB } from '../../tnp-db';
import { sleep } from 'sleep';
import { Project } from '../../project/abstract/project';
import { CLIWRAP } from '../cli-wrapper.backend';
export function $VSCODE_EXT(args: string, exit = true) {
  Helpers.run(`npm install && npm-run tsc && npm run build:install`, {
    cwd: config.pathes.tnp_vscode_ext_location,
    output: true
  }).sync();
  if (Helpers.isWsl) {
    Helpers.warn(`MANUALL INSTALL NEEDED FOR EXTENSION ${
      path.join(config.pathes.tnp_vscode_ext_location, 'tnp-vscode-ext-0.0.1.vsix')}`)
  }
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

function $WSL_FIX() {
  Helpers.run(`echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`).sync();
  process.exit(0)
}

function $VSCODE() {
  $INIT_VSCODE();
}

function $VSCODE_INIT() {
  $INIT_VSCODE();
}


async function $INIT_ALL_VSCODE() {
  await $VSCODE_INIT_ALL();
}

async function PROJECT_KILL_ALL() {
  let command: string;
  if (process.platform === 'darwin') {
    command = `kill -9 $(pgrep "Code Helper") && kill -9 $(pgrep "Code")`;
  }
  // run(`kill§ `).sync()
  process.exit(0)
}


function $FIX_WSL() {
  $WSL_FIX();
}

function $VSCODE_GLOBAL() {
  let keybindingPath = Helpers.resolve(`~/Library/Application Support/Code/User/keybindings.json`);
  const keys = [
    {
      "key": "shift+cmd+s",
      "command": "workbench.action.files.saveAll"
    },
    {
      "key": "alt+cmd+s",
      "command": "-workbench.action.files.saveAll"
    },
    {
      "key": "shift+cmd+c",
      "command": "workbench.action.tasks.terminate"
    },
    {
      "key": "shift+cmd+b",
      "command": "extension.firedevrunwatchbuild"
    }
  ];
  Helpers.writeFile(keybindingPath, keys);

  const settings = {
    "git.enableSmartCommit": true,
    "terminal.integrated.scrollback": 10000,
    // "files.insertFinalNewline": true,
    "html.format.endWithNewline": true,
    "html.format.wrapAttributes": "force-aligned",
    "files.hotExit": "onExitAndWindowClose",
    "typescript.referencesCodeLens.enabled": true,
    "git.autoRepositoryDetection": false,
    // Whether auto fetching is enabled.
    "git.autofetch": false,
    "gitlens.keymap": "none",
    "gitlens.advanced.messages": {
      "suppressCommitHasNoPreviousCommitWarning": false,
      "suppressCommitNotFoundWarning": false,
      "suppressFileNotUnderSourceControlWarning": false,
      "suppressGitVersionWarning": false,
      "suppressLineUncommittedWarning": false,
      "suppressNoRepositoryWarning": false,
      "suppressResultsExplorerNotice": false,
      "suppressShowKeyBindingsNotice": true
    },
    "search.followSymlinks": false,
    "javascript.implicitProjectConfig.experimentalDecorators": true,
    "gitlens.historyExplorer.enabled": true,
    "diffEditor.ignoreTrimWhitespace": true,
    "typescript.updateImportsOnFileMove.enabled": "never",
    "javascript.updateImportsOnFileMove.enabled": "never",
    "window.restoreWindows": "all",
    "search.searchOnType": false,
    "explorer.compactFolders": false,
  };
  let settingspath = Helpers.resolve('~/Library/Application Support/Code/User/settings.json');
  Helpers.writeFile(settingspath, settings);
  Helpers.info(`Vscode configured !`);
  process.exit(0);
}

const $VSCODE_FIX = async () => {
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
}

export default {
  $VSCODE_EXT: CLIWRAP($VSCODE_EXT, '$VSCODE_EXT'),
  $VSCODE_TEMP_SHOW: CLIWRAP($VSCODE_TEMP_SHOW, '$VSCODE_TEMP_SHOW'),
  $VSCODE_TEMP_HIDE: CLIWRAP($VSCODE_TEMP_HIDE, '$VSCODE_TEMP_HIDE'),
  $INIT_VSCODE: CLIWRAP($INIT_VSCODE, '$INIT_VSCODE'),
  $VSCODE_INIT_ALL: CLIWRAP($VSCODE_INIT_ALL, '$VSCODE_INIT_ALL'),
  $VSCODE: CLIWRAP($VSCODE, '$VSCODE'),
  $VSCODE_INIT: CLIWRAP($VSCODE_INIT, '$VSCODE_INIT'),
  $INIT_ALL_VSCODE: CLIWRAP($INIT_ALL_VSCODE, '$INIT_ALL_VSCODE'),
  PROJECT_KILL_ALL: CLIWRAP(PROJECT_KILL_ALL, 'PROJECT_KILL_ALL'),
  $WSL_FIX: CLIWRAP($WSL_FIX, '$WSL_FIX'),
  $FIX_WSL: CLIWRAP($FIX_WSL, '$FIX_WSL'),
  $VSCODE_GLOBAL: CLIWRAP($VSCODE_GLOBAL, '$VSCODE_GLOBAL'),
  $VSCODE_FIX: CLIWRAP($VSCODE_FIX, '$VSCODE_FIX'),
}
