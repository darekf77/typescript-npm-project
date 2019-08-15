
import * as vscode from 'vscode';
import * as path from 'path';
import * as fse from 'fs';
import * as child from 'child_process';
import { window, ProgressLocation } from 'vscode';

export type ProcesOptions = {
  findNearestProject?: boolean;
  syncProcess?: boolean;
  reloadAfterSuccesFinish?: boolean;
}

export function executeCommand(registerName: string, command: string, options?: ProcesOptions) {
  if (!options) {
    options = {};
  }
  if (typeof options.findNearestProject === 'undefined') {
    options.findNearestProject = false;
  }
  if (typeof options.syncProcess === 'undefined') {
    options.syncProcess = false;
  }
  if (typeof options.reloadAfterSuccesFinish === 'undefined') {
    options.reloadAfterSuccesFinish = false;
  }
  const { findNearestProject, reloadAfterSuccesFinish, syncProcess } = options;
  return vscode.commands.registerCommand(registerName, function (uri) {
    if (typeof uri === 'undefined') {
      if (vscode.window.activeTextEditor) {
        uri = vscode.window.activeTextEditor.document.uri;
      }
    }

    if (!uri) {
      vscode.window.showErrorMessage('Cannot copy relative path, as there appears no file is opened (or it is very large');
      return;
    }

    var realtivePath = vscode.workspace.asRelativePath(uri);
    const isAbsolute = path.isAbsolute(realtivePath);
    realtivePath = realtivePath.replace(/\\/g, '/');
    const cwd = vscode.workspace.rootPath;

    if (typeof cwd !== 'string') {
      return;
    }
    window.withProgress({
      location: ProgressLocation.Notification,
      title: `Executing: ${command}`,
      cancellable: true
    }, (progress, token) => {
      token.onCancellationRequested(() => {
        console.log("User canceled the long running operation")
      });

      progress.report({ increment: 0 });



      var p = new Promise(async (resolve) => {

        function finishAction(childResult: any) {
          if (reloadAfterSuccesFinish) {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
          } else {
            vscode.window.showInformationMessage(`Done executing command: ${command}.\n\n` + (childResult && childResult.toString()));
          }
          resolve();
        }

        function finishError(err: any) {
          vscode.window.showErrorMessage(`Can not execute command: ${command} ${err} `);
          resolve();
        }

        try {
          let newCwd = isAbsolute ? cwd : path.join(cwd, realtivePath);
          if (!fse.existsSync(newCwd)) {
            // QUICK_FIX for vscode workspace
            const cwdBase = path.basename(cwd);
            // window.showInformationMessage('cwdBase', cwdBase)
            const testCwd = newCwd.replace(`/${cwdBase}/${cwdBase}/`, `/${cwdBase}/`);
            if (fse.existsSync(testCwd)) {
              newCwd = testCwd;
            }
          }
          if (fse.existsSync(newCwd)) {
            if (!fse.lstatSync(newCwd).isDirectory()) {
              newCwd = path.dirname(newCwd);
            }
          } else {
            window.showWarningMessage(`cwd not found: ${newCwd}`);
          }
          const commandToExecute = `${command} --cwd ${newCwd} ${findNearestProject ? '--findNearestProject' : ''}`;

          window.showInformationMessage(commandToExecute)

          if (syncProcess) {
            let childResult = child.execSync(commandToExecute);
            progress.report({ increment: 50 });
            if (typeof childResult !== 'object') {
              throw `Child result is not a object`
            }
            progress.report({ increment: 50 });
            finishAction(childResult)
          } else {
            let proc = child.exec(commandToExecute);
            proc.on('message', (message) => {
              progress.report({ message });
            });
            proc.on('error', (err) => {
              finishError(err);
            });
            proc.on('exit', (code) => {
              finishAction(`Exit code: ${code}`)
            });
          }

        } catch (err) {
          finishError(err);
        }
      });
      return p;
    });

  });
}
