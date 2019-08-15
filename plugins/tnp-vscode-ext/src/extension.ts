// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
import { createMorphiModel } from './commands/create-morphi-model';
import { buildProject } from './commands/build-project';
import { executeCommand } from './commands/execute-command';


export function activate(context: vscode.ExtensionContext) {

  context.subscriptions.push(createMorphiModel('extension.tnpCLIcreateFiredevModel'));
  context.subscriptions.push(buildProject('extension.tnpCLIBuildProject'));
  context.subscriptions.push(executeCommand('extension.tnpCLIShowTempFiles', 'tnp vscode:temp:show', { findNearestProject: true }));
  context.subscriptions.push(executeCommand('extension.tnpCLIHideTempFiles', 'tnp vscode:temp:hide', { findNearestProject: true }));
  context.subscriptions.push(executeCommand('extension.tnpCLIRebuildExtension', 'tnp vscode:ext', { reloadAfterSuccesFinish: true }));



}

// this method is called when your extension is deactivated
export function deactivate() { }
