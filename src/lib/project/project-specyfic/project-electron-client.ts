//#region @backend
import { Project } from '../abstract';
//#endregion
import { BuildOptions } from 'tnp-db';
import { CLASS } from 'typescript-class-helpers';

//#region @backend
@CLASS.NAME('ProjectElectronClient')
//#endregion
export class ProjectElectronClient
  //#region @backend
  extends Project
//#endregion
{
  async buildLib() {

  }

  startOnCommand(args: string) {
    //#region @backendFunc
    const command = `echo "hello from electron lib" ${args}`;
    return command;
    //#endregion
  }

  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    return [
      'electron-builder.json',
      'main.ts',
      'tsconfig.json',
      'tsconfig.serve.json',
      'angular.webpack.js',
    ];
    //#endregion
  }

  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backend
    console.log('hello from building steps');
    process.exit(0)
    //#endregion
  }
}
