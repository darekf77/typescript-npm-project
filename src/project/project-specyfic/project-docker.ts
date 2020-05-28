import { Project } from '../abstract';
import { BuildOptions } from 'tnp-db';
import { CLASS } from 'typescript-class-helpers';

@CLASS.NAME('ProjectDocker')
export class ProjectDocker extends Project {
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


