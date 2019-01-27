//#region @backend
import * as _ from 'lodash';
import * as  psList from 'ps-list';

import { BaseController } from './base-controlller';
import { getWorkingDirOfProcess } from '../../process';
import { PsListInfo } from '../../models/ps-info';
import { ProjectFrom, Project } from '../../project';
import { BuildInstance } from '../entites/build-instance';
import { BuildOptions } from '../../models/build-options';

export class BuildsController extends BaseController {


  async addExisted() {
    const ps: PsListInfo[] = await psList();
    // console.log(ps.filter(p => p.cmd.split(' ').filter(p => p.endsWith(`/bin/tnp`)).length > 0));
    const builds = ps
      .filter(p => p.cmd.split(' ').filter(p => p.endsWith(`/bin/tnp`)).length > 0)
      .map(p => {
        const location = getWorkingDirOfProcess(p.pid);
        const project = ProjectFrom(location)
        if (project) {
          const b = new BuildInstance({
            location: getWorkingDirOfProcess(p.pid),
            pid: p.pid,
            cmd: p.cmd
          });
          // console.log('result build instance', b)
          return b;
        }
      })
      .filter(b => !!b)
      .filter(b => b.isTnpProjectBuild)

    this.crud.setBulk(builds);
  }

  add(project: Project, buildOptions: BuildOptions, pid: number) {
    const currentB = new BuildInstance({ buildOptions, pid, location: project.location })
    this.crud.addIfNotExist(currentB);
  }

  getExistedForOptions(project: Project, buildOptions: BuildOptions, pid: number): BuildInstance {
    const currentB = new BuildInstance({ buildOptions, pid, location: project.location })
    const all = this.crud.getAll<BuildInstance>(BuildInstance) as BuildInstance[]
    const existed = all.find(b => b.isEqual(currentB))
    if (_.isObject(existed)) {
      return existed;
    }
  }


}
//#endregion
