import * as _ from 'lodash';
import { Morphi } from 'morphi';


//#region @backend
import * as path from "path";
import * as fse from "fs-extra";
import { TnpDB } from 'tnp-bundle';
//#endregion

import { PROGRESS_DATA } from 'tnp-bundle';
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

  exitCode: number;
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
    progress: 'PROGRESS_DATA',
    allProgressData: ['PROGRESS_DATA']
  },
  defaultModelValues: {
    pid: void 0,
    cmd: 'echo "Hello from tnp process"'
  },
  additionalMapping: {

  },
  //#region @backend
  browserTransformFn: (entity) => {
    entity.browser.state = entity.state;

    entity.browser.stderLog = entity.stderLog;
    entity.browser.stderLogPath = entity.stderLogPath;

    entity.browser.stdoutLog = entity.stdoutLog;
    entity.browser.stdoutLogPath = entity.stdoutLogPath;

    entity.browser.exitCode = entity.exitCode;
    entity.browser.exitCodePath = entity.exitCodePath;
    return entity;
  }
  //#endregion
})
export class PROCESS extends Morphi.Base.Entity<PROCESS, IPROCESS, IProcessController> {

  constructor(options?: { name: string; cmd: string; cwd?: string; async?: boolean }) {
    super()
    this.name = options && options.name;
    this.cmd = options && options.cmd;
    this.cwd = options && options.cwd;
    if (options && _.isBoolean(options.async)) {
      this.isSync = !options.async;
    }
    if (!this.cwd) {
      this.cwd = process.cwd()
    }
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
  @Morphi.Orm.Column.Custom('boolean')
  //#endregion
  isSync = true;

  //#region @backend
  @Morphi.Orm.Column.Custom('varchar', { length: 500, nullable: true })
  //#endregion
  cmd: string = undefined;


  //#region @backend
  @Morphi.Orm.Column.Custom('varchar', { length: 2000, nullable: true })
  //#endregion
  cwd: string = undefined;

  //#region @backend
  @Morphi.Orm.Column.Custom('bigint', { nullable: true })
  //#endregion
  pid: number = undefined;


  // //#region @backend
  // @Morphi.Orm.Column.Custom('bigint', { nullable: true })
  // //#endregion
  // ppid: number = undefined;


  //#region @backend
  @Morphi.Orm.Column.Custom('bigint', { nullable: true })
  //#endregion
  previousPid: number = undefined;


  private _files(propertyName: string, surfix: string) {
    if (Morphi.IsBrowser) {
      return this.browser && this.browser[propertyName]
    }
    //#region @backend
    const p = path.join(Project.Tnp.location, 'tmp-processes-logs', `${this.id}.${surfix}.txt`);
    if (!fse.existsSync(path.dirname(p))) {
      fse.mkdirpSync(path.dirname(p))
    }
    return p;
    //#endregion
  }

  private __readLog(propertyName: 'stdoutLog' | 'stderLog' | 'exitCode'): string {
    if (Morphi.IsBrowser) {
      return this.browser && this.browser[propertyName] as any;
    }
    //#region @backend
    const p = this[`${propertyName}Path`]
    if (!fse.existsSync(p)) {
      return
    }
    return fse.readFileSync(p, 'utf8').toString()
    //#endregion
  }

  /**
   * Number from 0-100 or undefined
   */
  get progress(): PROGRESS_DATA {
    return _.last(this.allProgressData);
  }

  get allProgressData(): PROGRESS_DATA[] {
    return PROGRESS_DATA.resolveFrom(this.stdoutLog)
      .concat(PROGRESS_DATA.resolveFrom(this.stderLog))
  }

  get stder() {
    let res = _.isString(this.stderLog) ? this.stderLog.replace(/\[\[\[.*\]\]\]/g, '') : ''
    return res;
  }

  get stdout() {
    let res = _.isString(this.stdoutLog) ? this.stdoutLog.replace(/\[\[\[.*\]\]\]/g, '') : ''
    return res;
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

  get exitCode() {
    return Number(this.__readLog('exitCode'));
  }

  get exitCodePath() {
    return this._files('exitCodePath', 'exitcode')
  }

  async start(changesToModel?: () => void) {
    let data = await this.ctrl.start(this.id).received;
    _.merge(this, data.body.json);
    if (_.isFunction(changesToModel)) {
      changesToModel()
    }
    if (!this.isSync) {
      Morphi.Realtime.Browser.SubscribeEntityChanges(this, async () => {
        console.log('entity should be updated !')
        data = await this.ctrl.getBy(this.id).received;
        _.merge(this, data.body.json);
        if (_.isFunction(changesToModel)) {
          changesToModel()
        }
        const state = data.body.json.state
        if (state === 'exitedWithError' || state === 'exitedWithSuccess') {
          Morphi.Realtime.Browser.UnsubscribeEntityChanges(this);
        }
      })
    }

  }

  async stop() {
    await this.ctrl.stop(this.id).received;

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



}
