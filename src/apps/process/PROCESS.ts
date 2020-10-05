// console.log('INITING PROCESS')
//#region isomorphic
import * as _ from 'lodash';
import { PROGRESS_DATA } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { CLASS } from 'typescript-class-helpers';
import { Morphi, ModelDataConfig } from 'morphi';
import { ProcessDescriptor } from 'ps-list';
import { Project } from 'tnp-helpers';
//#endregion

//#region @backend
import * as path from 'path';
import * as fse from 'fs-extra';
import * as rimraf from 'rimraf';
import * as child from 'child_process';
import * as psList from 'ps-list';
//#endregion

//#region types
import type { ProcessController } from './ProcessController';

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
//#endregion

export class PROCESS_ENTITY extends Morphi.Base.Entity<PROCESS, IPROCESS, ProcessController> {

  //#region @backend
  @Morphi.Orm.Column.Custom('varchar', { length: 200, nullable: true })
  //#endregion
  name: string = undefined;

  //#region @backend

  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number = undefined;

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

  //#region @backend
  @Morphi.Orm.Column.Custom('bigint', { nullable: true })
  //#endregion
  ppid: number = undefined;

  //#region @backend
  @Morphi.Orm.Column.Custom('bigint', { nullable: true })
  //#endregion
  previousPid: number = undefined;
}

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
  additionalMapping: {},
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
export class PROCESS<PARAMS = any> extends PROCESS_ENTITY {
  public static ctrl: ProcessController;
  public parameters: PARAMS;
  public browser: IPROCESS = {} as any;
  private cmdOrg?: string = undefined;
  private _allProgressData: PROGRESS_DATA[];
  private _stder: string;
  private tempState: PROCESS_STATE = null;
  //#region @backend
  private starting = {};
  //#endregion

  //#region @backend
  public static get db() {
    const repo = this.ctrl.connection.getRepository(PROCESS);
    return repo;
  }
  //#endregion

  constructor(options?: { name: string; cmd: string; cwd?: string; async?: boolean }) {
    super()
    this.name = options && options.name;
    this.cmd = options && options.cmd;
    this.cwd = options && options.cwd;
    if (options && _.isBoolean(options.async)) {
      this.isSync = !options.async;
    }
    //#region @backend
    if (!this.cwd) {
      this.cwd = process.cwd()
    }
    //#endregion
  }

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


  get allProgressData(): PROGRESS_DATA[] {

    if (_.isArray(this._allProgressData)) {
      return this._allProgressData;
    }
    return PROGRESS_DATA.resolveFrom(this.stdoutLog)
      .concat(PROGRESS_DATA.resolveFrom(this.stderLog))
  }


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

  async start(): Promise<PROCESS> {
    //#region @backend
    if (Morphi.isNode) {

      if (!!this.starting[this.id]) {
        console.log('ommiting start')
        return this;
      }

      this.starting[this.id] = true;
      setTimeout(() => {
        this.starting[this.id] = false;
      }, 1000)

      rimraf.sync(this.stdoutLogPath)
      rimraf.sync(this.stderLogPath)
      rimraf.sync(this.exitCodePath)

      const COMMAND_TO_EXECUTE = this.parameters ? Helpers
        .strings
        .interpolateString(this.cmd)
        .withParameters(this.parameters)
        : this.cmd;

      console.log(`COMMAND_TO_EXECUTE: ${COMMAND_TO_EXECUTE}`)

      if (this.isSync) {

        try {
          var stdout = child.execSync(COMMAND_TO_EXECUTE, { cwd: this.cwd })
          fse.writeFileSync(this.exitCodePath, (0).toString())
        } catch (err) {
          fse.writeFileSync(this.exitCodePath, (((err && _.isNumber(err.status)) ? err.status : 1)).toString())
          var stderr = err;
        }

        fse.writeFileSync(this.stdoutLogPath, !stdout ? '' : stdout);
        fse.writeFileSync(this.stderLogPath, !stderr ? '' : stderr);
      } else {
        var p = Helpers.run(COMMAND_TO_EXECUTE, { cwd: this.cwd, output: false }).async()
        // console.log(`PROCESS STARTED ON PID: ${p.pid}`)
        this.pid = p.pid;
        this.previousPid = p.pid;

        await PROCESS.db.update(this.id, this);
        fse.writeFileSync(this.stdoutLogPath, '');
        fse.writeFileSync(this.stderLogPath, '');
        attach(p, this)
      }

      return this;
    }
    //#endregion
    this.cmdOrg = this.cmd;
    this.tempState = 'inProgressOfStarting';
    let data = await this.ctrl.start(this.id, this.modelDataConfig, this.parameters).received;
    this._allProgressData = void 0;
    this._stder = void 0;
    this._stdout = void 0;
    _.merge(this, data.body.json);
    this.tempState = null;
    return this;
  }

  async stop() {
    //#region @backend
    if (Morphi.isNode) {
      try {
        child.execSync(`pkill -9 -P ${this.pid}`)
        console.log(`Process (pid: ${this.pid}) childs killed successfully`)
      } catch (err) {
        console.log(err)
        console.log(`Process (pid: ${this.pid}) childs NOT KILLED ${this.pid}`)
      }

      try {
        child.execSync(`kill -9 ${this.pid}`)
        console.log(`Process (pid: ${this.pid}) killed successfully`)
      } catch (error) {
        console.log(`Process (pid: ${this.pid}) NOT KILLED`)
      }
      fse.writeFileSync(this.exitCodePath, 0)
      this.pid = void 0;
      await PROCESS.db.update(this.id, this);
      return this;
    }

    //#endregion
    this.tempState = 'inProgressOfStopping';
    let data = await this.ctrl.stop(this.id, this.modelDataConfig).received;
    _.merge(this, data.body.json);
    this.tempState = null;
    return this;
  }

  get context() {
    return `${this.name ? this.name : ''}${this.id}_${CLASS.getNameFromObject(this)}`;
  }


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


  public static async getAll(config?: ModelDataConfig) {
    let data = await PROCESS.ctrl.getAll(config).received;
    // console.log('BACKENDDATA', data)
    return data.body.json;
  }


  //#region @backend
  static async updateActive(processOrProcesses: PROCESS | PROCESS[], activeProcesses?: ProcessDescriptor[]) {
    if (_.isUndefined(activeProcesses)) {
      activeProcesses = await psList()
    }

    if (_.isArray(processOrProcesses)) {
      for (let index = 0; index < processOrProcesses.length; index++) {
        const p = processOrProcesses[index];
        await PROCESS.updateActive(p, activeProcesses);
      }
      return;
    }
    let p = processOrProcesses as PROCESS;
    if (_.isNumber(p.pid) && !activeProcesses.find(ap => ap.pid == p.pid)) {
      p.pid = undefined;
      await PROCESS.db.update(p.id, p);
    }

  }
  //#endregion


}


//#region @backend
function attach(p: child.ChildProcess, proc: PROCESS, resolve?: (any?) => any) {

  attachListeners(p, {
    msgAction: (chunk) => {
      // console.log('MSG:', chunk)
      fse.appendFileSync(proc.stdoutLogPath, chunk)
      Morphi.Realtime.Server.TrigggerEntityChanges(proc)
      Morphi.Realtime.Server.TrigggerEntityPropertyChanges<PROCESS>(proc, ['stderLog', 'stdoutLog', 'allProgressData'])
    },
    errorAction: (chunk) => {
      // console.log('ERR:', chunk)
      fse.appendFileSync(proc.stderLogPath, chunk)
      Morphi.Realtime.Server.TrigggerEntityChanges(proc)
      Morphi.Realtime.Server.TrigggerEntityPropertyChanges<PROCESS>(proc, ['stderLog', 'stdoutLog', 'allProgressData'])
    },
    endAction: async (exitCode) => {
      // console.log('END:')
      proc = await PROCESS.db.findOne(proc.id)
      proc.pid = void 0;
      fse.writeFileSync(proc.exitCodePath, (_.isNumber(exitCode) ? exitCode : '-111'))
      await PROCESS.db.update(proc.id, proc);
      Morphi.Realtime.Server.TrigggerEntityChanges(proc)
      Morphi.Realtime.Server.TrigggerEntityPropertyChanges<PROCESS>(proc, ['stderLog', 'stdoutLog', 'allProgressData'])

      if (_.isFunction(resolve)) {
        resolve(proc)
      }
    }
  })
}

function attachListeners(childProcess: child.ChildProcess, actions: {
  msgAction: (message: string) => void;
  endAction: (exitCode: number) => void;
  errorAction: (message: string) => void
}) {

  const { msgAction, endAction, errorAction } = actions;

  childProcess.stdout.on('data', (m) => {
    msgAction(m.toString());
  })

  childProcess.stdout.on('error', (m) => {
    errorAction(JSON.stringify(m))
  })

  childProcess.stderr.on('data', (m) => {
    msgAction(m.toString());
  })

  childProcess.stderr.on('error', (m) => {
    errorAction(JSON.stringify(m))
  })

  childProcess.on('exit', (exit, signal) => {
    endAction(exit);
    // childProcess.removeAllListeners();
  })

}

//#endregion

