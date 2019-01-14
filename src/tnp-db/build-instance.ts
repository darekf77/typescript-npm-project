//#region @backend
import { BuildOptions } from '../models';
import { ProjectFrom } from '../project';
import { Project } from '../project';


export type IBuildInstance = {
  buildOptions: BuildOptions;
  pid: number;
  location?: string;
};

export class BuildInstance implements IBuildInstance {
  buildOptions: BuildOptions;
  pid: number;
  location?: string;
  get project() {
    return ProjectFrom(this.location);
  }

}
//#endregion
