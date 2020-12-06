//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as child from 'child_process';
import { Project } from '../abstract';
//#endregion
import { BuildOptions } from 'tnp-db';
import { CLASS } from 'typescript-class-helpers';
import { Helpers } from 'tnp-helpers';

/**
 * DO NOT USE environment variables in this project directly
 */
//#region @backend
@CLASS.NAME('ProjectVscodeExt')
//#endregion
export class ProjectVscodeExt
  //#region @backend
  extends Project
//#endregion
{
  async buildLib() { }

  recreateIfNotExists() {
    return [
      'src/config.ts',
    ]
  }
  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    return [
      '.vscode/launch.json',
      '.vscode/tasks.json',
      '.vscodeignore',
      'vsc-extension-quickstart.md',
      'tsconfig.json',
      'update-proj.js',
      'src/extension.ts',
      'src/helpers.ts',
      'src/models.ts',
      'src/execute-command.ts',
      'src/progress-output.ts',
      ...this.recreateIfNotExists(),
    ];
    //#endregion
  }
  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backend
    if (buildOptions.watch) {
      this.run(`npm-run tsc -p ./`).sync();
      this.run(`node update-proj.js --watch`).async();
      this.run(`npm-run tsc -watch -p ./`).async();
    } else {
      this.run(`npm-run tsc -p ./`).sync();
      this.run(`node update-proj.js`).sync();
    }
    //#endregion
  }
  protected startOnCommand(args: string): string {
    //#region @backendFunc
    throw new Error("Method not implemented.");
    //#endregion
  }
}
