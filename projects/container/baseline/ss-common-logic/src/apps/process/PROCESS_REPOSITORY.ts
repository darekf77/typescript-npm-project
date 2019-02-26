//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as fse from 'fs-extra';

import { run, TnpDB, killProcess, Project } from 'tnp-bundle';
import * as child from 'child_process';
import { Morphi } from 'morphi';
import * as  psList from 'ps-list';
import { PsListInfo } from 'tnp-bundle'
import { PROCESS } from './PROCESS';

export interface PROCESS_ALIASES {
  process: string;
  processes: string;

}


@Morphi.Repository(PROCESS)
export class PROCESS_REPOSITORY extends Morphi.Base.Repository<PROCESS, PROCESS_ALIASES> {


  globalAliases: (keyof PROCESS_ALIASES)[] = ['process', 'processes']



  async start(proc: PROCESS): Promise<PROCESS> {

    rimraf.sync(proc.stdoutLogPath)
    rimraf.sync(proc.stderLogPath)
    rimraf.sync(proc.exitCodePath)

    if (proc.isSync) {

      try {
        var stdout = child.execSync(proc.cmd, { cwd: proc.cwd })
        fse.writeFileSync(proc.exitCodePath, (0).toString())
      } catch (err) {
        fse.writeFileSync(proc.exitCodePath, (((err && _.isNumber(err.status)) ? err.status : 1)).toString())
        var stderr = err;
      }

      fse.writeFileSync(proc.stdoutLogPath, !stdout ? '' : stdout);
      fse.writeFileSync(proc.stderLogPath, !stderr ? '' : stderr);
    } else {
      var p = run(proc.cmd, { cwd: proc.cwd, output: false }).async()
      // console.log(`PROCESS STARTED ON PID: ${p.pid}`)
      proc.pid = p.pid;
      proc.previousPid = p.pid;

      await this.update(proc.id, proc);
      fse.writeFileSync(proc.stdoutLogPath, '');
      fse.writeFileSync(proc.stderLogPath, '');
      this.attach(p, proc)
    }

    return proc;
  }

  attach(p: child.ChildProcess, proc: PROCESS, resolve?: (any?) => any) {

    this.attachListeners(p, {
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
        proc = await this.findOne(proc.id)
        proc.pid = void 0;
        fse.writeFileSync(proc.exitCodePath, (_.isNumber(exitCode) ? exitCode : '-111'))
        await this.update(proc.id, proc);
        Morphi.Realtime.Server.TrigggerEntityChanges(proc)
        Morphi.Realtime.Server.TrigggerEntityPropertyChanges<PROCESS>(proc, ['stderLog', 'stdoutLog', 'allProgressData'])

        if (_.isFunction(resolve)) {
          resolve(proc)
        }
      }
    })
  }


  async stop(proc: PROCESS): Promise<PROCESS> {
    try {
      child.execSync(`pkill -9 -P ${proc.pid}`)
      console.log(`Process (pid: ${proc.pid}) childs killed successfully`)
    } catch (err) {
      console.log(err)
      console.log(`Process (pid: ${proc.pid}) childs NOT KILLED ${proc.pid}`)
    }

    try {
      child.execSync(`kill -9 ${proc.pid}`)
      console.log(`Process (pid: ${proc.pid}) killed successfully`)
    } catch (error) {
      console.log(`Process (pid: ${proc.pid}) NOT KILLED`)
    }
    fse.writeFileSync(proc.exitCodePath, 0)
    proc.pid = void 0;
    await this.update(proc.id, proc);
    return proc;
  }


  private attachListeners(childProcess: child.ChildProcess, actions: {
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


  async updateActive(processOrProcesses: PROCESS | PROCESS[], activeProcesses?: PsListInfo[]) {
    if (_.isUndefined(activeProcesses)) {
      activeProcesses = await psList()
    }

    if (_.isArray(processOrProcesses)) {
      for (let index = 0; index < processOrProcesses.length; index++) {
        const p = processOrProcesses[index];
        await this.updateActive(p, activeProcesses);
      }
      return;
    }
    let p = processOrProcesses as PROCESS;
    if (_.isNumber(p.pid) && !activeProcesses.find(ap => ap.pid == p.pid)) {
      p.pid = undefined;
      await this.update(p.id, p);
    }

  }

}
//#endregion
