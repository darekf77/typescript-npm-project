//#region @backend
import * as _ from 'lodash';
import * as  psList from 'ps-list';

import { BaseController } from './base-controlller';
import { ProcessInstance } from '../entites';
import { PsListInfo } from '../../models/ps-info';


export class ProcessController extends BaseController {

  addExisted() {

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

