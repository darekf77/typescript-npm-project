//#region @backend
import { BuildOptions } from '../models';
import { ProjectFrom } from '../project';
import { Project } from '../project';
import { handleArguments } from '../scripts/BUILD-handle-arguments.fn';


export type IBuildInstance = {
  buildOptions: BuildOptions;
  cmd?: string;
  pid: number;
  location?: string;
};

export class BuildInstance implements IBuildInstance {

  constructor(data?: IBuildInstance) {
    if (!data) {
      data = {} as any;
    }
    const { buildOptions, pid, location, cmd } = data;
    this.buildOptions = buildOptions;
    this.pid = pid;
    this.cmd = cmd;
    this.location = location;
    if (!!this.buildOptions && !this.cmd) {
      // TODO
    }

    if (!this.buildOptions && !!this.cmd) {
      // TODO
      // this.buildOptions = handleArguments()
    }
  }

  buildOptions: BuildOptions;
  cmd?: string;

  public recreate() {

  }

  pid: number;
  location?: string;
  get project() {
    return ProjectFrom(this.location);
  }

}
//#endregion
