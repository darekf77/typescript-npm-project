//#region @backend
import * as _ from 'lodash';
import { BuildOptions } from '../models';
import { ProjectFrom } from '../project';
import { Project } from '../project/base-project'

export type IBuildInstance = {
  buildOptions?: BuildOptions;
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

    if (!this.cmd && !this.buildOptions) {
      // console.log('create empty IBuildInstance ')
    } else {
      if (!this.cmd) {
        this.cmd = BuildOptions.exportToCMD(this.buildOptions);
      }

      if (!this.buildOptions) {
        this.buildOptions = BuildOptions.from(this.cmd)
      }
    }


  }

  get isTnpProjectBuild() {
    return (_.isString(this.cmd) && this.cmd.trim() !== '' && _.isObject(this.buildOptions))
  }


  buildOptions: BuildOptions;
  cmd?: string;

  isEqual(anotherInstace: BuildInstance) {
    if (!anotherInstace) {
      return false;
    }
    return (this.pid == anotherInstace.pid ||
      (this.location === anotherInstace.location &&
        this.buildOptions.watch && anotherInstace.buildOptions.watch))
  }

  pid: number;
  location?: string;
  get project() {
    return ProjectFrom(this.location);
  }

}
//#endregion
