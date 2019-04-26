//#region @backend
import * as _ from 'lodash';
import * as  psList from 'ps-list';

import { BaseController } from './base-controlller';
import { getWorkingDirOfProcess } from '../../helpers';
import { PsListInfo } from '../../models/ps-info';
import { Project } from '../../project';
import { BuildInstance } from '../entites/build-instance';
import { warn } from '../../helpers';
import { BuildOptions } from '../../project/features/build-options';

export class BuildsController extends BaseController {

  /**
   * Update if proceses exists (by pid)
   */
  async update() {
    const ps: PsListInfo[] = await psList();
    const all = this.crud.getAll<BuildInstance>(BuildInstance);
    // console.log('[UPDATE BUILDS] BEFORE FILTER', all.map(c => c.pid))
    const filteredBuilds = all.filter(b => ps.filter(p => p.pid == b.pid).length > 0)
    // console.log('[UPDATE BUILDS] AFTER FILTER', filteredBuilds.map(c => c.pid))
    // process.exit(0)
    this.crud.setBulk(filteredBuilds, BuildInstance);
  }

  async addExisted() {
    const ps: PsListInfo[] = await psList();
    // console.log(ps.filter(p => p.cmd.split(' ').filter(p => p.endsWith(`/bin/tnp`)).length > 0));
    const builds = ps
      .filter(p => p.cmd.split(' ').filter(p => p.endsWith(`/bin/tnp`)).length > 0)
      .map(p => {
        const location = getWorkingDirOfProcess(p.pid);
        const project = Project.From(location)
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

    this.crud.setBulk(builds, BuildInstance);
  }

  async killInstancesFrom(projects: Project[]) {
    let projectsLocations = projects.map(p => p.location);
    (this.crud
      .getAll<BuildInstance>(BuildInstance) as BuildInstance[])
      .filter(b => projectsLocations.includes(b.project.location))
      .forEach(b => {
        try {
          b.kill()
        } catch (error) {
          warn(`Not able to kill ${b.brief}`)
        }
      })

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
