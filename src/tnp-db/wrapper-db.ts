//#region @backend
import * as low from 'lowdb';
import * as fse from 'fs-extra';
import * as  psList from 'ps-list';
import * as _ from 'lodash';
import { LowdbSync } from 'lowdb';
import * as path from 'path';
import * as FileSync from 'lowdb/adapters/FileSync'
import { Project } from '../project/base-project';
import { ITnpDBModel } from './db-model';
import { ProjectFrom } from '../project';
import { map } from 'rxjs/operator/map';
import { DomainInstance } from './domain-instance';
import { PortInstance } from './port-instance';
import { BuildInstance } from './build-instance';
import { PsListInfo } from './ps-info';
import { BuildOptions } from '../models';

const ENTITIES = Object.freeze({
  PROJECTS: 'projects',
  DOMAINS: 'domains',
  PORTS: 'ports',
  BUILDS: 'builds'
})

export class TnpDB {

  private static _instace: TnpDB;

  public static async Instance(reinit = false) {
    if (!this._instace) {
      const location = path.join(Project.Tnp.location, `bin/db.json`);
      this._instace = new TnpDB(location)
      await this._instace.init(reinit || !fse.existsSync(location))
    }
    return this._instace;
  }

  private _adapter;
  private db;
  private async init(recreate = false) {
    if (recreate) {
      fse.writeFileSync(this.location, '')
    }
    this._adapter = new FileSync(this.location)
    this.db = low(this._adapter)
    if (recreate) {
      this.db.defaults({ projects: [], domains: [], ports: [], builds: [] })
        .write()
      this.addExistedProjects()
      await this.addExistedBuilds();
    }
  }

  get getAll(): ITnpDBModel {
    const self = this;
    return {
      get projects() {
        const res = (self.db.get(ENTITIES.PROJECTS).value() as string[])
        if (_.isArray(res)) {
          return res.map(location => ProjectFrom(location))
        };
        return [];
      },

      get domains() {
        const res = (self.db.get(ENTITIES.DOMAINS).value() as any[])
        if (_.isArray(res)) {
          return res.map(v => _.merge(new DomainInstance(), v))
        }
        return []
      },

      get ports() {
        const res = (self.db.get(ENTITIES.PORTS).value() as any[])
        if (_.isArray(res)) {
          return res.map(v => _.merge(new PortInstance(), v))
        }
        return [];
      },

      get builds() {
        const res = (self.db.get(ENTITIES.BUILDS).value() as any[])
        if (_.isArray(res)) {
          return res.map(v => {
            const ins: BuildInstance = _.merge(new BuildInstance(), v)
            ins.buildOptions = _.merge(new BuildOptions(), ins.buildOptions)
            return ins;
          })
        }
        return [];
      }
    }
  }





  private discoverFrom(project: Project) {
    if (!project) {
      return
    }

    this.db.get(ENTITIES.PROJECTS).push(project.location).write();
    if (_.isArray(project.children)) {
      project.children.forEach(c => this.discoverFrom(c))
    }
    this.discoverFrom(project.preview)
  }

  async addExistedBuilds() {
    const ps: PsListInfo[] = await psList();
    console.log('ps list', ps)
    this.db.set(ENTITIES.BUILDS, ps);
  }

  addExistedProjects() {

    // this.discoverFrom(Project.Tnp);
    const npmProjects = path.resolve(path.join(Project.Tnp.location, '..'))
    fse.readdirSync(npmProjects)
      .map(name => path.join(npmProjects, name))
      .map(location => {
        // console.log(location)
        return ProjectFrom(location)
      })
      .filter(f => !!f)
      .filter(f => {
        // console.log(`Type for ${f.name} === ${f.type}`)
        return f.type !== 'unknow-npm-project'
      })
      .forEach(project => {
        // console.log(project.name)
        this.discoverFrom(project)
      })
  }

  public addProjectIfNotExist(project: Project) {
    if (!this.getAll.projects.includes(project)) {
      this.discoverFrom(project);
    }
  }

  public addBuildIfNotExist(project: Project, buildOptions: BuildOptions, pid: number) {
    if (!this.getAll.builds.find(b => {
      return (
        (b.project === project) &&
        (b.buildOptions.watch === buildOptions.watch) &&
        (b.pid == pid)
      )
    })) {
      this.db.get(ENTITIES.BUILDS).push({
        buildOptions: _.merge({}, _.omit(buildOptions, BuildOptions.PropsToOmmitWhenStringify)),
        pid,
        location: project.location
      } as BuildInstance).write()
    }
  }

  constructor(public location: string) {



  }


}
//#endregion
