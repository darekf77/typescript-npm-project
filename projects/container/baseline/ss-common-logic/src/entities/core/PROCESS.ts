import { Morphi } from 'morphi';


//#region @backend
import * as _ from 'lodash';
import * as path from "path";
import * as fse from "fs-extra";
//#endregion

import { IProcessController } from '../../controllers/core/ProcessController';



export interface IPROCESS extends PROCESS {
  state: PROCESS_STATE;
}

export type PROCESS_STATE = 'notStarted' | 'running' | 'exitedWithSuccess' | 'exitedWithError'


@Morphi.Entity<PROCESS>({
  className: 'PROCESS',
  mapping: {

  },
  defaultModelValues: {
    pid: void 0
  },
  //#region @backend
  createTable: false,
  //#region @backend
  browserTransformFn: (entity) => {
    entity.browser.state = entity.state;
    return entity;
  }
  //#endregion
})
export class PROCESS extends Morphi.Base.Entity<PROCESS, IPROCESS, IProcessController> {
  get id() {
    return this.pid;
  }
  public browser: IPROCESS = {} as any;
  pid: number;
  logFilePath: string;
  logFilePathError: string;

  start() {
    return this.ctrl.start(this.pid)
  }

  stop() {
    return this.ctrl.stop(this.pid)
  }

  get state(): PROCESS_STATE {
    if (Morphi.IsBrowser) {
      return this.browser.state
    }
    //#region @backend
    if (_.isNumber(this.pid)) {
      return 'running'
    }
    return 'notStarted';
    //#endregion
  }

  public static ctrl: IProcessController;
  public static async getAll() {
    let data = await this.ctrl.getAll().received;
    // console.log('BACKENDDATA', data)
    return data.body.json;
  }


  async kill() {
    console.log(this)
    let res = await this.ctrl.killmeee().received;
    console.log(`Controlelr in entity test!!!! ${res.body.text}`)
  }

}
