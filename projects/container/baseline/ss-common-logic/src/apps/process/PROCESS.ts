import * as _ from 'lodash';
import { Morphi, ModelDataConfig } from 'morphi';


//#region @backend
import * as path from "path";
import * as fse from "fs-extra";
import { TnpDB } from 'tnp-bundle';
//#endregion

import { PROGRESS_DATA } from 'tnp-bundle';
import { IProcessController } from './ProcessController';
import { Project, config } from 'tnp-bundle';
import { CLASS } from 'typescript-class-helpers';


export interface IPROCESS extends PROCESS {
  state: PROCESS_STATE;

  stderLog: string;
  stderLogPath: string;

  stdoutLog: string;
  stdoutLogPath: string;

  exitCode: number;
  exitCodePath: string;

  allProgressData: PROGRESS_DATA[];
  progress: PROGRESS_DATA;
  id: number;
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

    entity.browser.progress = entity.progress;


    // if (entity.modelDataConfig) {
    //   entity.modelDataConfig.set.exclude(entity.browser)
    //   entity.modelDataConfig = void 0;
    // }

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

  private setParameters(str, ...parameters: string[]) {
    var args = [].slice.call(arguments, 1),
      i = 0;

    return str.replace(/%s/g, () => args[i++]);
  }

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
  cmdOrg?: string = undefined;


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
    if (Morphi.IsBrowser && _.isUndefined(this._allProgressData)) {
      return this.browser && this.browser.progress;
    }
    return _.last(this.allProgressData);
  }

  _allProgressData: PROGRESS_DATA[];
  get allProgressData(): PROGRESS_DATA[] {

    if (_.isArray(this._allProgressData)) {
      return this._allProgressData;
    }
    return PROGRESS_DATA.resolveFrom(this.stdoutLog)
      .concat(PROGRESS_DATA.resolveFrom(this.stderLog))
  }

  _stder: string;
  get stder() {
    let res: string;
    if (_.isString(this._stder)) {
      res = this._stder;
    } else {
      res = _.isString(this.stderLog) ? this.stderLog.replace(/\[\[\[.*\]\]\]/g, '') : ''
    }
    // console.log(`stder: "${res}"`)
    return res;
  }

  _stdout: string;
  get stdout() {
    let res: string;
    if (_.isString(this._stdout)) {
      res = this._stdout;
    } else {
      res = _.isString(this.stdoutLog) ? this.stdoutLog.replace(/\[\[\[.*\]\]\]/g, '') : ''
    }
    // console.log(`stdout: "${res}"`)
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

  async start(...parameters: string[]) {
    this.cmdOrg = this.cmd;
    this.cmd = this.setParameters(this.cmd, ...parameters);
    this.tempState = 'inProgressOfStarting';
    let data = await this.ctrl.start(this.id, this.modelDataConfig).received;
    this._allProgressData = void 0;
    this._stder = void 0;
    this._stdout = void 0;
    _.merge(this, data.body.json);
    this.tempState = null;
  }

  async stop() {
    this.tempState = 'inProgressOfStopping';
    let data = await this.ctrl.stop(this.id, this.modelDataConfig).received;
    _.merge(this, data.body.json);
    this.tempState = null;
  }

  get context() {
    return `${this.name ? this.name : ''}${this.id}_${CLASS.getNameFromObject(this)}`;
  }

  tempState: PROCESS_STATE = null;
  get state(): PROCESS_STATE {
    if (!_.isNull(this.tempState)) {
      return this.tempState;
    }
    if (Morphi.IsBrowser) {
      return this.browser.state;
    }
    //#region @backend
    if (_.isNumber(this.pid)) {
      return 'running'
    }
    if (_.isNull(this.exitCode)) {
      return 'inProgressOfStopping'
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
  public static async getAll(config?: ModelDataConfig) {
    let data = await this.ctrl.getAll(config).received;
    // console.log('BACKENDDATA', data)
    return data.body.json;
  }

  //#region @backend
  static async save(process: PROCESS) {
    let res = await this.ctrl.db.PROCESS.save(process);
    return res;
  }

  static async getByID(id: number) {
    let res = await this.ctrl.db.PROCESS.findOne({ id });
    return res;
  }

  //#endregion


}
