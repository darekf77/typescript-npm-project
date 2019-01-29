//#region @backend
import * as _ from 'lodash';
import { BuildOptions } from '../../models';
import { ProjectFrom } from '../../project';
import { Project } from '../../project/base-project'
import { CommandInstance } from './command-instance';
import { DBBaseEntity } from './base-entity';

export type IBuildInstance = {
  buildOptions?: BuildOptions;
  cmd?: string;
  pid: number;
  location?: string;
};

export class BuildInstance extends DBBaseEntity implements IBuildInstance {


  constructor(data?: IBuildInstance) {
    super()
    if (!data) {
      data = {} as any;
    }
    const { buildOptions, pid, location, cmd } = data;
    this.buildOptions = buildOptions;
    this.pid = pid;
    this.cmd = CommandInstance.fixedCommand(cmd);
    this.location = location;

    if (!this.cmd && !this.buildOptions) {
      // console.log('create empty IBuildInstance ')
    } else {
      if (!this.cmd) {
        this.cmd = BuildOptions.exportToCMD(this.buildOptions);
      }

      if (!this.buildOptions) {
        const project: Project = Project.Current;
        this.buildOptions = BuildOptions.from(this.cmd, project)
      }
    }

  }

  get isTnpProjectBuild() {
    let res = (_.isString(this.cmd) && this.cmd.trim() !== '' && _.isObject(this.buildOptions))
    // if (!res) {
    // console.log('it is not a build', this.cmd)
    // }
    return res;
  }


  buildOptions: BuildOptions;
  cmd?: string;

  isEqual(anotherInstace: BuildInstance) {
    if (!anotherInstace) {
      return false;
    }
    return (this.pid == anotherInstace.pid ||
      (this.location === anotherInstace.location &&
        this.buildOptions.watch === anotherInstace.buildOptions.watch &&
        this.buildOptions.appBuild === anotherInstace.buildOptions.appBuild &&
        this.buildOptions.outDir === anotherInstace.buildOptions.outDir
      ))
  }

  pid: number;
  location?: string;
  get project() {
    return ProjectFrom(this.location);
  }

}
//#endregion
