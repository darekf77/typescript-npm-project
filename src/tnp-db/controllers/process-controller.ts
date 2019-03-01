//#region @backend
import * as _ from 'lodash';
import * as  psList from 'ps-list';

import { BaseController } from './base-controlller';
import { ProcessInstance, ProcessMetaInfo } from '../entites';
import { PsListInfo } from '../../models/ps-info';


export class ProcessController extends BaseController {

  async addExisted() {
    const ps: PsListInfo[] = await psList();
    // console.log(ps.filter(p => p.cmd.split(' ').filter(p => p.endsWith(`/bin/tnp`)).length > 0));
    const proceses = ps
      .filter(p => {
        return !!p.cmd.split(' ').find(p => p.endsWith(`/bin/tnp`))
      })
      .map(p => {
        const proc = new ProcessInstance();
        proc.pid = p.pid;
        proc.cmd = p.cmd;
        proc.name = p.name;
        return proc;
      })

    this.crud.setBulk(proceses, ProcessInstance);
  }
  async update() {
    const ps: PsListInfo[] = await psList();
    const all = this.crud.getAll<ProcessInstance>(ProcessInstance);
    // console.log('[UPDATE BUILDS] BEFORE FILTER', all.map(c => c.pid))
    const filteredBuilds = all.filter(b => {
      if (ps.filter(p => p.pid == b.pid).length > 0) {
        return true;
      } else if (_.isNumber(b.relation1TO1entityId)) {
        b.pid = void 0;
      } else {
        return false;
      }
    })
    // console.log('[UPDATE BUILDS] AFTER FILTER', filteredBuilds.map(c => c.pid))
    // process.exit(0)
    this.crud.setBulk(filteredBuilds, ProcessInstance);
  }

  async setProcess(process: ProcessInstance) {
    const all = this.crud.getAll<ProcessInstance>(ProcessInstance);
    const existed = all.find(p => {
      return p.isEqual(process) || (
        p.info && process.info &&
        p.info.className === process.info.className &&
        p.info.entityId === entityId
      )
    })
  }

  findProcessBy(metaInfo: ProcessMetaInfo) {
    const { className, entityId, entityProperty } = metaInfo;
    const proceses = this.crud.getAll<ProcessInstance>(ProcessInstance);
    let existed: ProcessInstance;
    if (_.isString(entityProperty)) {
      existed = proceses.find((p) => {
        return (
          p.info &&
          p.info.className === className &&
          p.info.entityId === entityId
        )
      })
    } else {
      existed = proceses.find((p) => {
        return (
          p.info &&
          p.info.className === className &&
          p.info.entityId === entityId &&
          p.info.entityProperty === entityProperty
        )
      })
    }
    return existed;
  }

  setProcessAndGetExisted(metaInfo: ProcessMetaInfo): ProcessInstance {
    let existed = this.findProcessBy(metaInfo)
    if (existed) {
      existed.setInfo(metaInfo);
      this.crud.set(existed);
    } else {
      let proc = new ProcessInstance();
      proc.setInfo(metaInfo);
      this.crud.set(proc);
      existed = proc;
    }
    return existed;
  }


}

//#endregion

