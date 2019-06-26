// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
import { createMorphiModel } from './commands/create-morphi-model';
import { buildProject } from './commands/build-project';


export function activate(context: vscode.ExtensionContext) {

  context.subscriptions.push(createMorphiModel('extension.tnpCLIcreateFiredevModel'));
  context.subscriptions.push(buildProject('extension.tnpCLIBuildProject'));

}

// this method is called when your extension is deactivated
export function deactivate() { }
