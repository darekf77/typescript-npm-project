// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
import { executeCommand } from './commands/execute-command';
import { commands } from './config';


export function activate(context: vscode.ExtensionContext) {
  for (let index = 0; index < commands.length; index++) {
    const { command = '', exec = '', options } = commands[index];
    context.subscriptions.push(executeCommand(command, exec, options));
  }
}

// this method is called when your extension is deactivated
export function deactivate() { }
