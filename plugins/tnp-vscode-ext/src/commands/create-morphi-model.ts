
import * as vscode from 'vscode';
import * as child from 'child_process';
import { window, ProgressLocation } from 'vscode';
export function createMorphiModel(registerName: string) {
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

    window.withProgress({
      location: ProgressLocation.Notification,
      title: "Creating MORPHI MODEL",
      cancellable: true
    }, (progress, token) => {
      token.onCancellationRequested(() => {
        console.log("User canceled the long running operation")
      });

      progress.report({ increment: 0 });

      var p = new Promise(async (resolve) => {

        try {

          const name = await getModuleName()

          let childResult = child.execSync(`tnp new model ${name} ${realtivePath} --cwd ${cwd}`);
          progress.report({ increment: 50 });
          if (typeof childResult !== 'object') {
            throw `Child result is not a object`
          }
          progress.report({ increment: 50 });
          vscode.window.showInformationMessage('Done creating MORPHI MODEL.\n\n' + (childResult && childResult.toString()));
        } catch (error) {
          vscode.window.showErrorMessage(`Can not create model: ${realtivePath} ${error} `);
        }

        resolve()
      });

      return p;
    });

  });
}


async function getModuleName(value: string = 'morphi-example') {
  const result = await vscode.window.showInputBox({
    value,
    placeHolder: value
  });
  return !result ? '' : result;
}
