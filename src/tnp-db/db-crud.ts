//#region @backend
import * as _ from 'lodash';

import { CLASS } from 'typescript-class-helpers'

import { BuildOptions } from '../models/build-options';
import { Project } from '../project/base-project';
import { DBBaseEntity } from './entites/base-entity';
import {
  BuildInstance, PortInstance, DomainInstance,
  EntityNames, CommandInstance, ProjectInstance
} from './entites';
import { ProjectFrom } from '../project';


export class DbCrud {


  constructor(private db: any) {

  }

  clearDBandReinit(defaultValues: Object) {
    this.db.defaults(defaultValues)
      .write()
  }

  getAll<T extends DBBaseEntity>(classFN: Function): T[] {
    const entityName: EntityNames = this.getEntityNameByClassFN(classFN);
    // console.log('entity name from object', entityName)
    const res = (this.db.get(entityName).value() as T[])
    // console.log('res', res)
    if (_.isArray(res) && res.length > 0) {
      return res.map(v => this.afterRetrive(v, entityName)).filter(f => !!f) as any;
    }
    return [];
  }

  addIfNotExist(entity: DBBaseEntity): boolean {
    // console.log(`[addIfNotExist] add if not exist entity: ${CLASS.getNameFromObject(entity)}`)
    const all = this.getAll(CLASS.getFromObject(entity))
    const indexFounded = all.findIndex(f => f.isEqual(entity))
    if (indexFounded === -1) {
      all.push(entity)
      this.setBulk(all);
      return true;
    }
    return false;
  }

  remove(entity: DBBaseEntity): boolean {
    const all = this.getAll(CLASS.getFromObject(entity))
    const filtered = all.filter(f => !f.isEqual(entity))
    if (filtered.length === all.length) {
      return false;
    }
    this.setBulk(filtered);
    return true;
  }

  set(entity: DBBaseEntity) {
    const all = this.getAll(CLASS.getFromObject(entity))
    const existed = all.find(f => f.isEqual(entity))
    if (existed) {
      _.merge(existed, entity)
    } else {
      all.push(entity)
    }
    this.setBulk(all);
  }

  setBulk(entites: DBBaseEntity[]): boolean {
    if (!_.isArray(entites) || entites.length === 0) {
      return false;
    }
    const entityName = this.getEntityNameByClassName(CLASS.getNameFromObject(_.first(entites)))
    const json = entites.map(c => this.preprareEntity(c));
    // console.log(`[setBulk] set json for entity ${entityName}`, json)
    this.db.set(entityName, json).write()
    return true;
  }

  private getEntityNameByClassFN(classFN: Function) {
    return this.getEntityNameByClassName(CLASS.getName(classFN))
  }

  private getEntityNameByClassName(className: string): EntityNames {
    return className === 'Project' ? 'projects' : DBBaseEntity.entityNameFromClassName(className) as EntityNames;
  }

  private afterRetrive<T=any>(value: any, entityName: EntityNames): DBBaseEntity {
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
      return ProjectInstance.from(location)
    }
    return value;
  }

  private preprareEntity<T extends DBBaseEntity = any>(entity: DBBaseEntity) {
    // console.log(`prerpare entity, typeof ${typeof entity}`, entity)
    // console.log('typeof BuildInstance', typeof BuildInstance)

    [BuildInstance, PortInstance, CommandInstance, DomainInstance, ProjectInstance]
      .find(f => {
        if(!f) {
          throw `Undefined instance of class. Propobly circural dependency`
        }
        return false;
      })

    if (entity instanceof BuildInstance) {
      const { pid, project, location, buildOptions, cmd } = entity as BuildInstance;
      return _.cloneDeep({
        buildOptions: _.merge({}, _.omit(buildOptions, BuildOptions.PropsToOmmitWhenStringify)),
        pid,
        cmd,
        location: _.isString(location) ? location : (!!project && project.location)
      }) as BuildInstance;
    }
    // console.log('typeof PortInstance', typeof PortInstance)
    if (entity instanceof PortInstance) {
      const port = entity as PortInstance;
      return _.cloneDeep({
        id: port.id,
        reservedFor: !!port.reservedFor && _.isString((port.reservedFor as Project).location) ?
          (port.reservedFor as Project).location : port.reservedFor
      } as PortInstance);
    }
    // console.log('typeof CommandInstance', typeof CommandInstance)
    if (entity instanceof CommandInstance) {
      const cmd = entity as CommandInstance;
      const { command, location } = cmd;
      return _.cloneDeep({
        command, location
      } as CommandInstance);
    }
    // console.log('typeof DomainInstance', typeof DomainInstance)
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
    return entity;
  }

}

//#endregion
