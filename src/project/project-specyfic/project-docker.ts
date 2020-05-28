//#region @backend
import { Project } from '../abstract';
//#endregion
import { BuildOptions } from 'tnp-db';
import { CLASS } from 'typescript-class-helpers';

//#region @backend
@CLASS.NAME('ProjectDocker')
//#endregion
export class ProjectDocker
  //#region @backend
  extends Project
//#endregion
{
  async buildLib() { }

  startOnCommand() {
    //#region @backendFunc
    return 'echo "no docker support jet"'
    //#endregion
  }

  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    return [

    ];
    //#endregion
  }

  async buildSteps(buildOptions?: BuildOptions) { }
}


