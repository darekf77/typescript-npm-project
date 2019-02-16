import * as _ from 'lodash';
import { Morphi } from 'morphi';


//#region @backend
import * as path from "path";
import * as fse from "fs-extra";
import { TnpDB } from 'tnp-bundle';
//#endregion

import { IProcessController } from '../../controllers/core/ProcessController';
import { Project, config } from 'tnp-bundle';
import { CLASS } from 'typescript-class-helpers';
export { Models } from 'ng2-rest/models'
import { Models } from 'ng2-rest/models'


export interface IPROCESS extends PROCESS {
  state: PROCESS_STATE;
  stderLog: string;
  stderLogPath: string;
  stdoutLog: string;
  stdoutLogPath: string;
  exitCodePath: string;
}

export type PROCESS_STATE =
  'notStarted' |
  'inProgressOfStarting' |
  'running' |
  'inProgressOfStopping' |
  'exitedWithSuccess' |
  'exitedWithError'


@Morphi.Entity<PROCESS>({
  className: 'PROCESS',
  mapping: {

  },
  defaultModelValues: {
    pid: void 0,
    cmd: 'echo "Hello from tnp process"'
  },
  //#region @backend
  browserTransformFn: (entity) => {
    entity.browser.state = entity.state;

    entity.browser.stderLog = entity.stderLog;
    entity.browser.stderLogPath = entity.stderLogPath;

    entity.browser.stdoutLog = entity.stdoutLog;
    entity.browser.stdoutLogPath = entity.stdoutLogPath;

    entity.browser.exitCodePath = entity.exitCodePath;
    return entity;
  }
  //#endregion
})
export class PROCESS extends Morphi.Base.Entity<PROCESS, IPROCESS, IProcessController> {

  constructor(options?: { name: string; cmd: string; }) {
    super()
    this.name = options && options.name;
    this.cmd = options && options.cmd;
  }
;
  //#region @backend
  @Morphi.Orm.Column.Custom('varchar', { length: 200, nullable: true })
  //#endregion
  name: string = undefined;


  //#region @backend

  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number = undefined;

  public browser: IPROCESS = {} as any;



  //#region @backend
  @Morphi.Orm.Column.Custom('varchar', { length: 500, nullable: true })
  //#endregion
  cmd: string = undefined;

  //#region @backend
  @Morphi.Orm.Column.Custom('bigint', { nullable: true })
  //#endregion
  pid: number = undefined;


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

  private __readLog(propertyName: string) {
    if (Morphi.IsBrowser) {
      return this.browser[propertyName]
    }
    //#region @backend
    const p = this[`${propertyName}Path`]
    return fse.existsSync(p) && fse.readFileSync(p, 'utf8').toString()
    //#endregion
  }

  get stdoutLog() {
    return this.__readLog('stdoutLog');
  }
  get stdoutLogPath() {
    return this._files('stdoutLogPath', 'stdout')
  }

  get stderLog() {
    return this.__readLog('stderLog');
  }
  get stderLogPath() {
    return this._files('stderLogPath', 'stder')
  }

  get exitCodePath() {
    return this._files('exitCodePath', 'exitcode')
  }

  async start() {
    let data = await this.ctrl.start(this).received;
    _.merge(this, data.body.json);
  }

  async stop() {
    let data = await this.ctrl.stop(this).received;
    _.merge(this, data.body.json);
  }

  get context() {
    return `${this.name ? this.name : ''}${this.id}_${CLASS.getNameFromObject(this)}`;
  }

  get state(): PROCESS_STATE {
    if (Morphi.IsBrowser) {
      return this.browser.state;
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
