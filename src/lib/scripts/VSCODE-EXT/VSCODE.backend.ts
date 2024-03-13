import { Helpers } from 'tnp-helpers/src';
import { path, _, crossPlatformPath, os } from 'tnp-core/src';
import { config } from 'tnp-config/src';
import { Project } from '../../project/abstract/project';

export function $VSCODE_EXT(args: string, exit = true) {
  Helpers.run(`${config.frameworkName} clear && ${config.frameworkName} bd && ${config.frameworkName} il`, {
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
  project.recreate.vscode.settings.hideOrShowFilesInVscode(false);
}

function hidefilesfor(project: Project) {
  project.recreate.vscode.settings.hideOrShowFilesInVscode(true);
}

export function $VSCODE_TEMP_SHOW(args: string, exit = true) {
  showfilesfor(Project.Current);
  if (exit) {
    process.exit(0);
  }
}

export function $VSCODE_TEMP_HIDE(args: string, exit = true) {
  hidefilesfor(Project.Current);
  if (exit) {
    process.exit(0);
  }
}

export function $INIT_VSCODE() {
  Project.Current.recreate.vscode.settings.hideOrShowFilesInVscode();
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
  const keybindingPathLinxu = path.join(crossPlatformPath(os.userInfo().homedir), '.config/Code/User/keybindings.json');
  const keybindingPath = path.join(crossPlatformPath(os.userInfo().homedir), `Library/Application Support/Code/User/keybindings.json`);
  const keysMac = [
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

  const keysLinux = [
    {
      "key": "shift+ctrl+s",
      "command": "workbench.action.files.saveAll"
    },
    {
      "key": "alt+ctrl+s",
      "command": "-workbench.action.files.saveAll"
    },
    {
      "key": "shift+ctrl+z",
      "command": "default:redo"
    },
    {
      "key": "ctrl+shift+z",
      "command": "-extension.vscode-git-automator.addAndCommitCurrentFile"
    },
    {
      "key": "shift+alt+f",
      "command": "-filesExplorer.findInFolder",
      "when": "explorerResourceIsFolder && explorerViewletVisible && filesExplorerFocus && !inputFocus"
    },
    {
      "key": "shift+alt+f",
      "command": "editor.action.formatDocument",
      "when": "editorHasDocumentFormattingProvider && editorTextFocus && !editorReadonly && !inCompositeEditor"
    },
    {
      "key": "ctrl+shift+i",
      "command": "-editor.action.formatDocument",
      "when": "editorHasDocumentFormattingProvider && editorTextFocus && !editorReadonly && !inCompositeEditor"
    }
  ];

  if (process.platform !== 'win32') {
    if (process.platform === 'linux') {
      Helpers.writeFile(keybindingPathLinxu, keysLinux);
    }
    if (process.platform === 'darwin') {
      Helpers.writeFile(keybindingPath, keysMac);
    }

  }

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
    "window.commandCenter": false,
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
    "editor.wordBasedSuggestions": false,
    'typescript.tsdk': 'node_modules/typescript/lib',
    'terminal.integrated.tabs.enabled': false,
    'tslint.autoFixOnSave': false, // TODO
    'tslint.enable': false, // TODO
    'prettier.enable': false, // TODO
    'tslint.alwaysShowRuleFailuresAsWarnings': true,
    "workbench.editor.enablePreview": true,
    "security.workspace.trust.banner": "never",
    "telemetry.enableTelemetry": false,
    "security.workspace.trust.enabled": false,
    "terminal.integrated.enableMultiLinePasteWarning": false,
    "git.detectSubmodules": false,
    "editor.wordBasedSuggestionswordBasedSuggestions": false,
    "git.openRepositoryInParentFolders": "never",
    "eslint.migration.2_x": "off",
    "redhat.telemetry.enabled": false,
    "editor.accessibilitySupport": "off",
  };
  const settingspathWindows = path.join(crossPlatformPath(os.userInfo().homedir), 'AppData/Roaming/Code/User/settings.json');
  const settingspathLinux = path.join(crossPlatformPath(os.userInfo().homedir), '.config/Code/User/settings.json');
  let settingspath = path.join(crossPlatformPath(os.userInfo().homedir), 'Library/Application Support/Code/User/settings.json');

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

  const dest = crossPlatformPath(settingspath);
  Helpers.writeFile(dest, settings);
  Helpers.info(`Vscode configured !`);
  process.exit(0);
}

const $FILES_HIDE = (args, exit) => $VSCODE_TEMP_HIDE(args, exit);
const $FILES_SHOW = (args, exit) => $VSCODE_TEMP_SHOW(args, exit);

const $FILES_SHOW_ALL = (args, exit = true) => {
  let proj: Project;

  proj = Project.Current;

  showfilesfor(proj);
  exit && process.exit(0);
};

const $FILES_HIDE_ALL = (args, exit = true) => {
  let proj: Project;

  proj = Project.Current;

  hidefilesfor(proj);
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
  $VSCODE: Helpers.CLIWRAP($VSCODE, '$VSCODE'),
  $VSCODE_INIT: Helpers.CLIWRAP($VSCODE_INIT, '$VSCODE_INIT'),
  PROJECT_KILL_ALL: Helpers.CLIWRAP(PROJECT_KILL_ALL, 'PROJECT_KILL_ALL'),
  $WSL_FIX: Helpers.CLIWRAP($WSL_FIX, '$WSL_FIX'),
  $FIX_WSL: Helpers.CLIWRAP($FIX_WSL, '$FIX_WSL'),
  $VSCODE_GLOBAL: Helpers.CLIWRAP($VSCODE_GLOBAL, '$VSCODE_GLOBAL'),
};
