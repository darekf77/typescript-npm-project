//#region @backend
import * as _ from 'lodash';
import * as  psList from 'ps-list';

import { BaseController } from './base-controlller';
import { ProcessInstance } from '../entites';
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
    const filteredBuilds = all.filter(b => ps.filter(p => p.pid == b.pid).length > 0)
    // console.log('[UPDATE BUILDS] AFTER FILTER', filteredBuilds.map(c => c.pid))
    // process.exit(0)
    this.crud.setBulk(filteredBuilds, ProcessInstance);
  }

  async updateCurrentProcess() {
    const pid = process.pid;
    const env = process.env;
    const current = new ProcessInstance()
    current.pid = pid;
    current.env = env;
    this.crud.addIfNotExist(current)
  }


}

//#endregion

