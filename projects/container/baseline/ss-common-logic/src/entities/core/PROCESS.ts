import { Morphi } from 'morphi';


//#region @backend
import * as _ from 'lodash';
import * as path from "path";
import * as fse from "fs-extra";
//#endregion

import { IProcessController } from '../../controllers/core/ProcessController';
import { Project, config } from 'tnp-bundle';



export interface IPROCESS extends PROCESS {
  state: PROCESS_STATE;
  stderLogPath: string;
  stdoutLogPath: string;
  exitCodePath: string;
}

export type PROCESS_STATE = 'notStarted' | 'running' | 'exitedWithSuccess' | 'exitedWithError'


@Morphi.Entity<PROCESS>({
  className: 'PROCESS',
  mapping: {

  },
  defaultModelValues: {
    pid: void 0,
    cmd: 'echo "Hello from tnp process"'
  },
  //#region @backend
  createTable: false,
  //#region @backend
  browserTransformFn: (entity) => {
    entity.browser.state = entity.state;
    entity.browser.stderLogPath = entity.stderLogPath;
    entity.browser.stdoutLogPath = entity.stdoutLogPath;
    entity.browser.exitCodePath = entity.exitCodePath;
    return entity;
  }
  //#endregion
})
export class PROCESS extends Morphi.Base.Entity<PROCESS, IPROCESS, IProcessController> {
  get id() {
    return this.pid;
  }
  public browser: IPROCESS = {} as any;
  cmd: string;
  pid: number;


  private _files(propertyName: string, surfix: string) {
    if (Morphi.IsBrowser) {
      return this.browser[propertyName]
    }
    //#region @backend
    const p = path.join(Project.Tnp.location, 'tmp-processes-logs', `${this.pid}.${surfix}.txt`);
    if (!fse.existsSync(path.dirname(p))) {
      fse.mkdirpSync(path.dirname(p))
    }
    return p;
    //#endregion
  }

  get stdoutLogPath() {
    return this._files('stdoutLogPath', 'stdout')
  }

  get stderLogPath() {
    return this._files('stderLogPath', 'stder')
  }

  get exitCodePath() {
    return this._files('exitCodePath', 'exitcode')
  }

  start() {
    return this.ctrl.start(this)
  }

  stop() {
    return this.ctrl.stop(this)
  }

  get state(): PROCESS_STATE {
    if (Morphi.IsBrowser) {
      return this.browser.state
    }
    //#region @backend
    if (_.isNumber(this.pid)) {
      return 'running'
    }
    if (fse.existsSync(this.exitCodePath)) {
      let exitcode = Number(fse.readFileSync(this.exitCodePath).toString())
      if (!isNaN(exitcode)) {
        return exitcode === 0 ? 'exitedWithSuccess' : 'exitedWithError'
      }
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
