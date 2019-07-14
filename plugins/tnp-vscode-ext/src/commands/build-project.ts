
import * as vscode from 'vscode';
import * as path from 'path';
import * as child from 'child_process';
import { window, ProgressLocation } from 'vscode';
export function buildProject(registerName: string) {
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
    realtivePath = realtivePath.replace(/\\/g, '/');
    const cwd = vscode.workspace.rootPath;

    const projectName = path.basename(realtivePath);

    window.withProgress({
      location: ProgressLocation.Notification,
      title: `Building t "${projectName}"`,
      cancellable: true
    }, (progress, token) => {
      token.onCancellationRequested(() => {
        console.log("User canceled the long running operation")
      });

      progress.report({ increment: 0 });

      var p = new Promise(async (resolve) => {

        try {

          // const name = await getModuleName()

          let childResult = child.execSync(`tnp build:dist`, {
            cwd: path.join(cwd as any, projectName)
          });
          progress.report({ increment: 50 });
          if (typeof childResult !== 'object') {
            throw `Child result is not a object`
          }
          progress.report({ increment: 50 });
          vscode.window.showInformationMessage(`Done building project "${projectName}".\n\n` + (childResult && childResult.toString()));
        } catch (error) {
          vscode.window.showErrorMessage(`Fail build of project "${projectName}": ${realtivePath} ${error} `);
        }

        resolve()
      });

      return p;
    });

  });
}


// async function getModuleName(value: string = 'morphi-example') {
//   const result = await vscode.window.showInputBox({
//     value,
//     placeHolder: value
//   });
//   return !result ? '' : result;
// }
