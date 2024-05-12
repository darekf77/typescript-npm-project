//#region @backend
import { CoreModels, _, crossPlatformPath, os, path } from "tnp-core/src";
import { Helpers } from "tnp-helpers/src";
import { CommandLineFeature } from "tnp-helpers/src";
import { Project } from "../abstract/project";
import { BuildOptions, InitOptions } from "../../build-options";
import { MESSAGES, TEMP_DOCS } from "../../constants";
import { config } from "tnp-config/src";

export class $Vscode extends CommandLineFeature<{}, Project> {
  public _() {

  }

  //#region global
  GLOBAL() {
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
      'editor.renderWhitespace': true,
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
      "editor.minimap.enabled": true,
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
    this._exit();
  }
  //#endregion

  TEMP_SHOW() {
    this._showfilesfor(Project.ins.Current);
    this._exit()
  }

  TEMP_HIDE() {
    this._hidefilesfor(this.project);
    this._exit()
  }

  INIT() {
    this.project.__recreate.vscode.settings.hideOrShowFilesInVscode();
    this._exit();
  }

  PROJ_EXT() {
    const p = this.project.pathFor('.vscode/extensions.json');
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
    this._exit();
  }


  _showfilesfor(project: Project) {
    project.__recreate.vscode.settings.hideOrShowFilesInVscode(false);
  }

  _hidefilesfor(project: Project) {
    project.__recreate.vscode.settings.hideOrShowFilesInVscode(true);
  }
}

export default {
  $Vscode: Helpers.CLIWRAP($Vscode, '$Vscode'),
}
