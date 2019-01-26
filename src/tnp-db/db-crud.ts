import * as _ from 'lodash';
import { CLASS } from 'typescript-class-helpers'

import { BuildOptions } from '../models/build-options';
import { Project } from '../project/base-project';
import { DBBaseEntity } from './entites/base-entity';
import { BuildInstance, PortInstance, DomainInstance, EntityNames as EntityName, CommandInstance } from './entites';
import { ProjectFrom } from '../project';



export class DbCrud {


  constructor(private db: any) {

  }

  clearDBandReinit() {
    this.db.defaults({ projects: [], domains: [], ports: [], builds: [], commands: [] })
      .write()
  }

  getALL<T extends DBBaseEntity<any>>(classFN: Function): DBBaseEntity<T>[] {
    const entityName: EntityName = this.getEntityNameByClassFN(classFN);
    const res = (this.db.get(entityName).value() as T[])
    if (_.isArray(res) && res.length > 0) {
      return res.map(v => this.afterRetrive(v, entityName));
    }
    return [];
  }

  addIfNotExist<T extends DBBaseEntity<any>>(entity: DBBaseEntity<T>): boolean {
    const indexFounded = this.getALL(CLASS.getFromObject(entity))
      .findIndex(f => f.isEqual(entity))
    if (indexFounded === -1) {
      return false;
    }
    const all = this.getALL(CLASS.getFromObject(entity))
    all.push(entity)
    this.setBulk(all);
    return true;
  }

  remove<T extends DBBaseEntity<any>>(entity: DBBaseEntity<T>): boolean {
    const all = this.getALL(CLASS.getFromObject(entity))
    const filtered = all.filter(f => !f.isEqual(entity))
    if (filtered.length === all.length) {
      return false;
    }
    this.setBulk(filtered);
    return true;
  }

  update<T extends DBBaseEntity<any>>(entity: DBBaseEntity<T>): boolean {
    const all = this.getALL(CLASS.getFromObject(entity))
    const existed = all.find(f => f.isEqual(entity))
    if (!existed) {
      return false;
    }
    _.merge(existed, entity)
    this.setBulk(all);
    return true;
  }

  set<T extends DBBaseEntity<any>>(entity: DBBaseEntity<T>) {
    const all = this.getALL(CLASS.getFromObject(entity))
    const existed = all.find(f => f.isEqual(entity))
    if (!existed) {
      all.push(entity)
      this.setBulk(all);
    }
    this.update(entity)
  }

  setBulk<T extends DBBaseEntity<any>>(entites: DBBaseEntity<T>[]): boolean {
    if (!_.isArray(entites) || entites.length === 0) {
      return false;
    }
    const entityName = this.getEntityNameByClassName(CLASS.getNameFromObject(_.first(entites)))
    const json = entites.map(c => this.preprareEntity(c));
    this.db.set(entityName, json).write()
    return true;
  }

  private getEntityNameByClassFN(classFN: Function) {
    return this.getEntityNameByClassName(CLASS.getName(classFN))
  }

  private getEntityNameByClassName(className: string): EntityName {
    return className === 'Project' ? 'projects' : DBBaseEntity.entityFromClassName(className) as EntityName;
  }

  private afterRetrive<T=any>(value: any, entityName: EntityName): DBBaseEntity<T> {
    if (entityName === 'builds') {
      const v = value as BuildInstance;
      const ins: BuildInstance = _.merge(new BuildInstance(), v)
      ins.buildOptions = _.merge(new BuildOptions(), ins.buildOptions)
      return ins as any;
    }
    if (entityName === 'commands') {
      const cmd = value as CommandInstance;
      const c = new CommandInstance(cmd.command, cmd.location);
      return c as any;
    }
    if (entityName === 'domains') {
      const v = value as DomainInstance;
      const d: DomainInstance = _.merge(new DomainInstance(), v);
      d.declaredIn = d.declaredIn.map(d => {
        return { environment: d.environment, project: ProjectFrom(d.project as any) }
      })
      return d as any;
    }
    if (entityName === 'ports') {
      const v = value as PortInstance;
      const r = _.merge(new PortInstance(), v) as PortInstance;
      if (_.isString(r.reservedFor)) {
        r.reservedFor = ProjectFrom(r.reservedFor)
      }
      return r as any;
    }
    if (entityName === 'projects') {
      const location = value;
      return ProjectFrom(location) as any;
    }
  }

  private preprareEntity<T extends DBBaseEntity<any> = any>(entity: DBBaseEntity<T>) {
    if (entity instanceof BuildInstance) {
      const { pid, project, location, buildOptions, cmd } = entity as BuildInstance;
      return _.cloneDeep({
        buildOptions: _.merge({}, _.omit(buildOptions, BuildOptions.PropsToOmmitWhenStringify)),
        pid,
        cmd,
        location: _.isString(location) ? location : project.location
      }) as BuildInstance;
    }
    if (entity instanceof PortInstance) {
      const port = entity as PortInstance;
      return _.cloneDeep({
        id: port.id,
        reservedFor: !!port.reservedFor && _.isString((port.reservedFor as Project).location) ?
          (port.reservedFor as Project).location : port.reservedFor
      } as PortInstance);
    }
    if (entity instanceof CommandInstance) {
      const cmd = entity as CommandInstance;
      const { command, location } = cmd;
      return _.cloneDeep({
        command, location
      } as CommandInstance);
    }
    if (entity instanceof DomainInstance) {
      const domain = entity as DomainInstance;
      const { activeFor, address, declaredIn } = domain;
      return _.cloneDeep({
        declaredIn: declaredIn.map(d => {
          return { environment: d.environment, project: d.project.location }
        }) as any,
        address,
        // production,
        // secure,
        // sockets
      } as DomainInstance);
    }

  }

}



export class DBAccess {




}
