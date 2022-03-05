import { Helpers } from 'tnp-helpers';
import { path, _, crossPlatformPath, fse, os } from 'tnp-core';
import { config } from 'tnp-config';
import { TnpDB } from 'tnp-db';
import { Project } from '../../project/abstract/project';

export function $VSCODE_EXT(args: string, exit = true) {
  Helpers.run(`npm install && npm-run tsc && npm run build:install`, {
    cwd: config.pathes.tnp_vscode_ext_location,
    output: true
  }).sync();
  if (Helpers.isWsl) {
    Helpers.warn(`MANUALL INSTALL NEEDED FOR EXTENSION ${path.join(config.pathes.tnp_vscode_ext_location, 'tnp-vscode-ext-0.0.1.vsix')}`);
  }
  if (exit) {
    process.exit(0);
  }
}

function showfilesfor(project: Project) {
  project.recreate.vscode.settings.excludedFiles(false);
  project.recreate.vscode.settings.colorsFromWorkspace();
}

function hidefilesfor(project: Project) {
  project.recreate.vscode.settings.excludedFiles(true);
  project.recreate.vscode.settings.colorsFromWorkspace();
}

export function $VSCODE_TEMP_SHOW(args: string, exit = true) {
  showfilesfor((Project.Current as Project));
  if (exit) {
    process.exit(0);
  }
}

export function $VSCODE_TEMP_HIDE(args: string, exit = true) {
  hidefilesfor((Project.Current as Project));
  if (exit) {
    process.exit(0);
  }
}

export function $INIT_VSCODE() {
  (Project.Current as Project).recreate.vscode.settings.excludedFiles();
  (Project.Current as Project).recreate.vscode.settings.colorsFromWorkspace();
  process.exit(0);
}

export async function $VSCODE_INIT_ALL() {
  const db = await TnpDB.Instance();
  const projects = await db.getProjects();
  for (let index = 0; index < projects.length; index++) {
    const proj = projects[index];
    (proj.project as Project).recreate.vscode.settings.excludedFiles();
    (proj.project as Project).recreate.vscode.settings.colorsFromWorkspace();
  }
  process.exit(0);
}

function $WSL_FIX() {
  Helpers.run(`echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`).sync();
  process.exit(0);
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
    command = `kill -9 $(pgrep 'Code Helper') && kill -9 $(pgrep 'Code')`;
  }
  // run(`kill§ `).sync()
  process.exit(0);
}


function $FIX_WSL() {
  $WSL_FIX();
}

function $VSCODE_GLOBAL() {
  const keybindingPathLinxu = Helpers.resolve('~/.config/Code/User/keybindings.json');
  const keybindingPath = Helpers.resolve(`~/Library/Application Support/Code/User/keybindings.json`);
  const keys = [
    {
      'key': 'shift+cmd+s',
      'command': 'workbench.action.files.saveAll'
    },
    {
      'key': 'alt+cmd+s',
      'command': '-workbench.action.files.saveAll'
    },
    {
      'key': 'shift+cmd+c',
      'command': 'extension.firedevstopdefaultbuild'
    },
    {
      'key': 'shift+cmd+b',
      'command': 'extension.firedevrundefaultbuild'
    },
    {
      'key': 'ctrl+cmd+p',
      'command': 'extension.vscode-git-automator.pushLocalCommits'
    },
    {
      'key': 'shift+cmd+z',
      'command': 'default:redo'
    },
  ];
  Helpers.writeFile(
    process.platform === 'linux' ? keybindingPathLinxu : keybindingPath
    , keys);

  const windowsSettings = {
    'terminal.integrated.defaultProfile.windows': 'Git Bash',
    'terminal.integrated.shellArgs.windows': [
      '--login'
    ],
    'window.customMenuBarAltFocus': false,
    'window.enableMenuBarMnemonics': false,
    'terminal.integrated.rightClickBehavior': 'selectWord',
  };

  const settingsMacOS = {
    'terminal.integrated.shell.osx': '/bin/bash',
  };

  let settings = {
    'git.enableSmartCommit': true,
    'terminal.integrated.scrollback': 10000,
    // 'files.insertFinalNewline': true,
    'html.format.endWithNewline': true,
    'html.format.wrapAttributes': 'force-aligned',
    'files.hotExit': 'onExitAndWindowClose',
    'typescript.referencesCodeLens.enabled': true,
    'git.autoRepositoryDetection': false,
    // Whether auto fetching is enabled.
    'git.autofetch': false,
    'gitlens.keymap': 'none',
    'gitlens.advanced.messages': {
      'suppressCommitHasNoPreviousCommitWarning': false,
      'suppressCommitNotFoundWarning': false,
      'suppressFileNotUnderSourceControlWarning': false,
      'suppressGitVersionWarning': false,
      'suppressLineUncommittedWarning': false,
      'suppressNoRepositoryWarning': false,
      'suppressResultsExplorerNotice': false,
      'suppressShowKeyBindingsNotice': true
    },
    'search.followSymlinks': false,
    'javascript.implicitProjectConfig.experimentalDecorators': true,
    'js/ts.implicitProjectConfig.experimentalDecorators': true,
    'gitlens.historyExplorer.enabled': true,
    'diffEditor.ignoreTrimWhitespace': true,
    'explorer.confirmDelete': false,
    'typescript.updateImportsOnFileMove.enabled': 'never',
    'javascript.updateImportsOnFileMove.enabled': 'never',
    'window.restoreWindows': 'one', // all sucks
    'search.searchOnType': false,
    'scm.alwaysShowProviders': false,
    'breadcrumbs.enabled': true,
    'extensions.ignoreRecommendations': true,
    'git.showProgress': true,
    'debug.node.showUseWslIsDeprecatedWarning': false,
    'explorer.compactFolders': false,
    'workbench.colorTheme': 'Default Light+',
    'update.mode': 'none',
    'debug.onTaskErrors': 'abort',
    'typescript.tsdk': 'node_modules/typescript/lib',
    'terminal.integrated.tabs.enabled': false,
    'tslint.autoFixOnSave': false, // TODO
    'tslint.enable': false, // TODO
    'tslint.alwaysShowRuleFailuresAsWarnings': true,
    "workbench.editor.enablePreview": true,
  };
  const settingspathWindows = Helpers.resolve('~/AppData/Roaming/Code/User/settings.json');
  const settingspathLinux = Helpers.resolve('~/.config/Code/User/settings.json');
  let settingspath = '~/Library/Application Support/Code/User/settings.json';

  if (process.platform === 'darwin') {
    settings = _.merge(settings, settingsMacOS);
  }
  if (process.platform === 'win32') {
    settingspath = settingspathWindows;
    settings = _.merge(settings, windowsSettings);
  }
  if (process.platform === 'linux') {
    settingspath = settingspathLinux;
  }

  const dest = crossPlatformPath(path.join(os.userInfo().homedir, settingspath).replace('~', ''));
  Helpers.writeFile(dest, settings);
  Helpers.writeFile(settingspath, settings);
  Helpers.info(`Vscode configured !`);
  process.exit(0);
}

const $VSCODE_FIX = async () => {
  const db = await TnpDB.Instance();
  const projects = await db.getProjects();
  for (let index = 0; index < projects.length; index++) {
    const proj = projects[index];
    proj.project && (proj.project as Project).recreate.vscode.settings.changeColorTheme(false);
  }
  await new Promise(resolve => setTimeout(() => resolve(void 0), 1000));
  for (let index = 0; index < projects.length; index++) {
    const proj = projects[index];
    proj.project && (proj.project as Project).recreate.vscode.settings.changeColorTheme();
  }
  await new Promise(resolve => setTimeout(() => resolve(void 0), 1000));
  for (let index = 0; index < projects.length; index++) {
    const proj = projects[index];
    proj.project && (proj.project as Project).recreate.vscode.settings.gitReset();
  }
  process.exit(0);
};


const $FILES_HIDE = (args, exit) => $VSCODE_TEMP_HIDE(args, exit);
const $FILES_SHOW = (args, exit) => $VSCODE_TEMP_SHOW(args, exit);
const $FILES_SHOW_ALL = (args, exit = true) => {
  let proj: Project;
  if ((Project.Current as Project).isWorkspaceChildProject) {
    proj = (Project.Current as Project).parent;
  } else {
    proj = (Project.Current as Project);
  }
  showfilesfor(proj);
  if (proj.isWorkspace) {
    proj.children.forEach(c => showfilesfor(c));
  }
  exit && process.exit(0);
};

const $FILES_HIDE_ALL = (args, exit = true) => {
  let proj: Project;
  if ((Project.Current as Project).isWorkspaceChildProject) {
    proj = (Project.Current as Project).parent;
  } else {
    proj = (Project.Current as Project);
  }
  hidefilesfor(proj);
  if (proj.isWorkspace) {
    proj.children.forEach(c => hidefilesfor(c));
  }
  exit && process.exit(0);
};

export function $EXT(args, exit) {
  return $VSCODE_EXT(args, exit);
}

export async function $PROJ_EXT(args, exit) {

  const p = crossPlatformPath(path.join(process.cwd(), '.vscode/extensions.json'));
  console.log(p)
  const extensions: { recommendations: string[] } = Helpers.readJson(p, { recommendations: [] }, true);
  for (let index = 0; index < extensions.recommendations.length; index++) {
    const extname = extensions.recommendations[index];
    try {
      Helpers.run(`code --install-extension ${extname}`).sync();
      Helpers.info(`Installed: ${extname}`)
    } catch (error) {
      Helpers.warn(`Not able to install ${extname}`);
    }
  }
  process.exit(0)
}

export default {
  $EXT: Helpers.CLIWRAP($EXT, '$EXT'),
  $PROJ_EXT: Helpers.CLIWRAP($PROJ_EXT, '$PROJ_EXT'),
  $VSCODE_EXT: Helpers.CLIWRAP($VSCODE_EXT, '$VSCODE_EXT'),
  $VSCODE_TEMP_SHOW: Helpers.CLIWRAP($VSCODE_TEMP_SHOW, '$VSCODE_TEMP_SHOW'),
  $FILES_SHOW: Helpers.CLIWRAP($FILES_SHOW, '$FILES_SHOW'),
  $FILES_SHOW_ALL: Helpers.CLIWRAP($FILES_SHOW_ALL, '$FILES_SHOW_ALL'),
  $VSCODE_TEMP_HIDE: Helpers.CLIWRAP($VSCODE_TEMP_HIDE, '$VSCODE_TEMP_HIDE'),
  $FILES_HIDE: Helpers.CLIWRAP($FILES_HIDE, '$FILES_HIDE'),
  $FILES_HIDE_ALL: Helpers.CLIWRAP($FILES_HIDE_ALL, '$FILES_HIDE_ALL'),
  $INIT_VSCODE: Helpers.CLIWRAP($INIT_VSCODE, '$INIT_VSCODE'),
  $VSCODE_INIT_ALL: Helpers.CLIWRAP($VSCODE_INIT_ALL, '$VSCODE_INIT_ALL'),
  $VSCODE: Helpers.CLIWRAP($VSCODE, '$VSCODE'),
  $VSCODE_INIT: Helpers.CLIWRAP($VSCODE_INIT, '$VSCODE_INIT'),
  $INIT_ALL_VSCODE: Helpers.CLIWRAP($INIT_ALL_VSCODE, '$INIT_ALL_VSCODE'),
  PROJECT_KILL_ALL: Helpers.CLIWRAP(PROJECT_KILL_ALL, 'PROJECT_KILL_ALL'),
  $WSL_FIX: Helpers.CLIWRAP($WSL_FIX, '$WSL_FIX'),
  $FIX_WSL: Helpers.CLIWRAP($FIX_WSL, '$FIX_WSL'),
  $VSCODE_GLOBAL: Helpers.CLIWRAP($VSCODE_GLOBAL, '$VSCODE_GLOBAL'),
  $VSCODE_FIX: Helpers.CLIWRAP($VSCODE_FIX, '$VSCODE_FIX'),
};
