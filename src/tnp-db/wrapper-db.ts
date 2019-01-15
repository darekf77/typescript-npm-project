//#region @backend
import * as low from 'lowdb';
import * as fse from 'fs-extra';
import * as  psList from 'ps-list';
import * as _ from 'lodash';
import { LowdbSync } from 'lowdb';
import * as path from 'path';
import * as FileSync from 'lowdb/adapters/FileSync'
import { Project } from '../project/base-project';
import { ProjectFrom } from '../project';
import { map } from 'rxjs/operator/map';
import { DomainInstance } from './domain-instance';
import { PortInstance } from './port-instance';
import { BuildInstance } from './build-instance';
import { PsListInfo } from './ps-info';
import { BuildOptions, BuildData } from '../models';
import { ENTITIES } from './entities';
import { PortsSet } from './ports-set';


export class TnpDB {

  private static _instance: TnpDB;

  private static _firstTimeInit = true;
  public static async Instance(forceReinit = false, buildData?: BuildData) {

    if (!this._instance) {
      const location = path.join(Project.Tnp.location, `bin/db.json`);
      this._instance = new TnpDB(location)
      if (buildData) {
        const { project, buildOptions, pid } = buildData;
        await this._instance.init(forceReinit || !fse.existsSync(location), project, buildOptions, pid)
      } else {
        await this._instance.init(forceReinit || !fse.existsSync(location))
      }

    }
    if (this._firstTimeInit) {
      console.log('[wrapper-db] exist listener inited')

      process.on('exit', l => {
        console.log('[wrapper-db] EXIT ACTION EXECUTED')
        let builds = this._instance.getAll.builds;
        builds = builds.filter(b => b.pid === process.pid);
        this._instance.set.builds(builds);
      })
    }
    return this._instance;
  }

  private _adapter;
  private db;
  private async init(recreate = false, projectForBuild?: Project, buildOptions?: BuildOptions, buildPid?: number) {
    if (recreate) {
      fse.writeFileSync(this.location, '')
    }
    this._adapter = new FileSync(this.location)
    this.db = low(this._adapter)
    if (recreate) {
      this.db.defaults({ projects: [], domains: [], ports: [], builds: [] })
        .write()
      this.add.existedProjects()
      console.log('[wrapper-db] Existed projects added')
      if (_.isObject(buildOptions) && _.isObject(projectForBuild) && _.isNumber(buildPid)) {
        this.add.buildIfNotExist(projectForBuild, buildOptions, buildPid);
        console.log('[wrapper-db] Current project added')
      }
    }
  }

  get getAll() {
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

  public static get prepareToSave() {
    return {
      ports(ports: PortInstance[]) {
        return ports.map(p => {
          return TnpDB.prepareToSave.port(p)
        });
      },
      builds(builds: BuildInstance[]) {
        return builds.map(p => {
          return TnpDB.prepareToSave.build(p)
        });
      },
      build(build: BuildInstance) {
        const { buildOptions, pid, project, location } = build;
        return _.cloneDeep({
          buildOptions: _.merge({}, _.omit(buildOptions, BuildOptions.PropsToOmmitWhenStringify)),
          pid,
          location: _.isString(location) ? location : project.location
        }) as BuildInstance;
      },
      port(port: PortInstance) {
        return _.cloneDeep({
          id: port.id,
          reservedFor: !!port.reservedFor && _.isString((port.reservedFor as Project).location) ?
            (port.reservedFor as Project).location : port.reservedFor
        } as PortInstance);
      }
    }
  }


  get set() {
    const self = this;
    return {
      builds(builds: BuildInstance[]) {
        const json = builds.map(c => TnpDB.prepareToSave.build(c));
        self.db.set(ENTITIES.BUILDS, json);
      },
      ports(ports: PortInstance[]) {
        const json = ports.map(c => TnpDB.prepareToSave.port(c));
        self.db.set(ENTITIES.PORTS, json);
      }
    }
  }

  get add() {
    const self = this;

    return {
      existedProjects() {

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
            self.discoverFrom(project)
          })
      },

      projectIfNotExist(project: Project) {
        if (!self.getAll.projects.includes(project)) {
          self.discoverFrom(project);
        }
      },

      buildIfNotExist(project: Project, buildOptions: BuildOptions, pid: number) {
        if (!self.getAll.builds.find(b => {
          return (
            (b.project === project) &&
            (b.buildOptions.watch === buildOptions.watch) &&
            (b.pid == pid)
          )
        })) {
          self.db.get(ENTITIES.BUILDS).push(TnpDB.prepareToSave.build({
            buildOptions,
            pid,
            project
          })).write()
        }
      }
    }
  }

  get portsSet() {

    let res = (this.db.get(ENTITIES.PORTS).value() as any[])
    if (_.isArray(res)) {
      res = res.map(v => {
        const r = _.merge(new PortInstance(), v) as PortInstance;
        if (_.isString(r.reservedFor)) {
          r.reservedFor = ProjectFrom(r.reservedFor)
        }
        return r;
      })
    } else {
      res = []
    }

    return new PortsSet(res, (ports) => {
      this.set.ports(ports);
    });
  }


  constructor(public location: string) {



  }


}
//#endregion
