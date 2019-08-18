
import * as vscode from 'vscode';
import * as path from 'path';
import * as fse from 'fs';
import * as child from 'child_process';
import { window, ProgressLocation } from 'vscode';
import { ProgressData } from './progress-output';
import { ProcesOptions } from '../process-options';
import { capitalizeFirstLetter } from '../helpers';

export function executeCommand(registerName: string, commandToExecute: string | string[], options?: ProcesOptions) {
  const commandToExecuteReadable = '"' + ((Array.isArray(commandToExecute) && typeof commandToExecute !== 'string') ?
    commandToExecute.join(',') : commandToExecute) + '"'
  //#region handle args
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
  if (typeof options.cancellable === 'undefined') {
    options.cancellable = true;
  }
  if (typeof options.tnpNonInteractive === 'undefined') {
    options.tnpNonInteractive = true;
  }
  if (typeof options.debug === 'undefined') {
    options.debug = false;
  }
  if (typeof options.askBeforeExecute === 'undefined') {
    options.askBeforeExecute = false;
  }
  if (typeof options.tnpShowProgress === 'undefined') {
    options.tnpShowProgress = true;
  }
  if (typeof options.showOutputDataOnSuccess === 'undefined') {
    options.showOutputDataOnSuccess = false;
  }
  if (typeof options.showSuccessMessage === 'undefined') {
    options.showSuccessMessage = true;
  }
  //#endregion

  let { findNearestProject, findNearestProjectType, reloadAfterSuccesFinish,
    findNearestProjectTypeWithGitRoot, findNearestProjectWithGitRoot,
    syncProcess, cancellable, title, tnpNonInteractive, askBeforeExecute,
    tnpShowProgress, showOutputDataOnSuccess, debug, showSuccessMessage } = options;

  debug = false; // TODO

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
    if (askBeforeExecute) {
      const continueMsg = `Continue: ` + (title ? title : `command: ${commandToExecuteReadable}`);
      window.showQuickPick(['Abort', continueMsg], {
        canPickMany: false,
      }).then((data) => {
        if (data === continueMsg) {
          process();
        }
      });
    } else {
      process();
    }

    function process() {
      const mainTitle = capitalizeFirstLetter(title ? title : `Executing: ${commandToExecuteReadable}`);
      window.withProgress({
        location: ProgressLocation.Notification,
        title: mainTitle,
        cancellable,
      }, (progress, token) => {


        progress.report({ increment: 0 });


        var p = new Promise(async (resolve) => {

          function finishAction(childResult: any) {
            if (reloadAfterSuccesFinish) {
              vscode.commands.executeCommand('workbench.action.reloadWindow');
            } else {
              if (showSuccessMessage) {
                let doneMsg = title ? title : `command: ${commandToExecuteReadable}`;
                vscode.window.showInformationMessage(`Done executing ${doneMsg}.\n\n` + (childResult ? childResult.toString() : ''));
              }
            }
            resolve();
          }

          function finishError(err: any, data?: string) {
            let doneMsg = title ? title : `command: ${commandToExecuteReadable}`;
            vscode.window.showErrorMessage(`Execution of ${doneMsg} failed:\n ${commandToExecuteReadable}
          ${err}
          ${data}
          `);
            resolve();
          }

          token.onCancellationRequested(() => {
            if (proc) {
              proc.kill('SIGINT');
            }
            window.showInformationMessage(`User canceled command: ${commandToExecuteReadable}`)
          });

          let data = '';
          try {
            let newCwd = isAbsolute ? cwd : path.join(cwd as string, realtivePath);
            if (!fse.existsSync(newCwd as string)) {
              // QUICK_FIX for vscode workspace
              const cwdBase = path.basename(cwd as string);
              // window.showInformationMessage('cwdBase', cwdBase)
              const testCwd = (newCwd as string).replace(`/${cwdBase}/${cwdBase}/`, `/${cwdBase}/`);
              if (fse.existsSync(testCwd)) {
                newCwd = testCwd;
              }
            }
            if (fse.existsSync(newCwd as string)) {
              if (!fse.lstatSync(newCwd as string).isDirectory()) {
                newCwd = path.dirname(newCwd as string);
              }
            } else {
              window.showWarningMessage(`cwd not found: ${newCwd}`);
            }

            const flags = [
              tnpShowProgress && '--tnpShowProgress',
              tnpNonInteractive && '--tnpNonInteractive',
              findNearestProject && '--findNearestProject',
              findNearestProjectWithGitRoot && '--findNearestProjectWithGitRoot',
              findNearestProjectType && `--findNearestProjectType=${findNearestProjectType}`,
              findNearestProjectTypeWithGitRoot && `--findNearestProjectTypeWithGitRoot=${findNearestProjectTypeWithGitRoot}`,
            ].filter(f => !!f).join(' ');

            const cmd = (typeof commandToExecute === 'string') ? `${commandToExecute} --cwd ${newCwd} ${flags}` :
              commandToExecute.map(c => `${c} --cwd ${newCwd} ${flags}`).join(' && ')
            // tslint:disable-next-line: no-unused-expression

            // const log = window.createOutputChannel(mainTitle);
            if (debug) {
              window.showInformationMessage(cmd);
            }
            // tslint:disable-next-line: no-unused-expression


            data += `commandToExecute: ${commandToExecuteReadable}`

            if (syncProcess) {
              let childResult = child.execSync(cmd);
              progress.report({ increment: 50 });
              if (typeof childResult !== 'object') {
                throw `Child result is not a object`
              }
              progress.report({ increment: 50 });
              finishAction(showOutputDataOnSuccess ? childResult : '')
            } else {
              var proc = child.exec(cmd);

              proc.stdout.on('data', (message) => {
                // tslint:disable-next-line: no-unused-expression

                data += message.toString();

                ProgressData.resolveFrom(message.toString(), (json) => {
                  progress.report({ message: json.msg, increment: json.value / 100 });
                });
              });
              proc.stdout.on('error', (err) => {
                // tslint:disable-next-line: no-unused-expression

                data += err.toString();

                window.showErrorMessage(`Error: ${JSON.stringify(err, null, 2)}`)
              });
              proc.stderr.on('data', (message) => {
                // tslint:disable-next-line: no-unused-expression

                data += message.toString();

                ProgressData.resolveFrom(message.toString(), (json) => {
                  progress.report({ message: json.msg, increment: json.value / 100 });
                });
              });
              proc.stderr.on('error', (err) => {
                // tslint:disable-next-line: no-unused-expression

                data += (err.toString());

                window.showErrorMessage(`Error: ${JSON.stringify(err, null, 2)}`);
              });
              proc.on('exit', (code) => {
                if (code == 0) {
                  finishAction(showOutputDataOnSuccess ? data : '');
                } else {
                  finishError(`Command exited with code: ${code}`, data);
                }
              });
            }

          } catch (err) {
            finishError(err, data);
          }
        });
        return p;
      });
    }

  });
}
