
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as child from 'child_process';

import { window, ProgressLocation } from 'vscode';

export type NaviGenCommand = 'example' |
  'module' |
  'api:module' |
  'routing:module' |
  'component' |
  'api:service' |
  'service' |
  'pipe' |
  'directive'

export function commandCreateTsExampleModule(registerName: string, type: NaviGenCommand) {
  return vscode.commands.registerCommand(registerName, async (uri) => {

    if (typeof uri === 'undefined') {
      if (vscode.window.activeTextEditor) {
        uri = vscode.window.activeTextEditor.document.uri;
      }
    }
    if (!uri) {
      vscode.window.showErrorMessage('Cannot copy relative path, as there appears no file is opened (or it is very large');
      return;
    }
    vscode.window.showInformationMessage(uri)
    var relativePath = vscode.workspace.asRelativePath(uri);
    relativePath = relativePath.replace(/\\/g, '/');
    const cwd: string = vscode.workspace.rootPath as string;

    window.withProgress({
      location: ProgressLocation.Notification,
      title: "Generating example ts",
      cancellable: true
    }, (progress, token) => {
      token.onCancellationRequested(() => {
        console.log("User canceled the long running operation")
      });

      progress.report({ increment: 0 });

      var p = new Promise(async resolve => {
        try {

          if (fs.existsSync(path.join(cwd, relativePath)) && !fs.lstatSync(path.join(cwd, relativePath)).isDirectory()) {
            relativePath = path.dirname(relativePath)
          }

          const name = await getModuleName(path.basename(relativePath) !== 'src' ? path.basename(relativePath) : void 0)

          if (name !== path.basename(relativePath)) {
            relativePath = path.join(relativePath, name)
          }

          let childResult = child.execSync(`navi gen:${type} ${relativePath} --cwd ${cwd}`, { cwd });
          progress.report({ increment: 50, message: "After execution" });
          if (typeof childResult !== 'object') {
            throw `Child result is not a object`
          }

          progress.report({ increment: 50, message: "Done !" });
          vscode.window.showInformationMessage(`Done creating ts ${type}.`);
        } catch (error) {

          vscode.window.showErrorMessage(`Can not create ts ${type} ${relativePath} `
            + error
          )
        }
        resolve()
      });

      return p;
    });

  });
}

async function getModuleName(value: string = 'navi-my-example') {
  const result = await vscode.window.showInputBox({
    value,
    placeHolder: value
  });
  return !result ? '' : result;
}
