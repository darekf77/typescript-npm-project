//#region @backend
import { Project } from '../abstract';
//#endregion
import { BuildOptions } from 'tnp-db';
import { CLASS } from 'typescript-class-helpers';

//#region @backend
@CLASS.NAME('ProjectIonicClient')
//#endregion
export class ProjectIonicClient
  //#region @backend
  extends Project
//#endregion
{
  async buildLib() {

  }

  startOnCommand(args: string) {
    //#region @backendFunc
    const command = `echo "hello from ionic" ${args}`;
    return command;
    //#endregion
  }

  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    return [
      'tsconfig.json'
    ];
    //#endregion
  }

  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backend
    const { prod, watch, outDir } = buildOptions;
    if (watch) {
      this.run(`tnp npm-run ionic serve --no-open -p ${this.getDefaultPort()}`).async()
    } else {
      this.run(`tnp npm-run ionic-app-scripts build ${prod ? '--prod' : ''}`).sync();
    }
    //#endregion
  }
}
