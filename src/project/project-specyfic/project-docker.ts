//#region @backend
import { Project } from '../abstract';
import { BuildOptions } from '../features';


export class ProjectDocker extends Project {
  async buildLib() {
    // throw new Error("Method not implemented.");
  }


  startOnCommand() {
    return 'echo "no docker support jet"'
  }

  projectSpecyficFiles(): string[] {
    return [

    ];
  }

  async buildSteps(buildOptions?: BuildOptions) {
    const { prod, watch, outDir } = buildOptions;

  }
}

//#endregion
