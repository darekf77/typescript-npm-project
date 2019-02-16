//#region @backend
import * as _ from 'lodash';
import * as fse from 'fs-extra';

import { run, TnpDB, killProcess } from 'tnp-bundle';
import * as child from 'child_process';
import { Morphi } from 'morphi';
import { PROCESS } from '../../entities/core/PROCESS';
import { config } from 'tnp-bundle';

export interface PROCESS_ALIASES {
  process: string;
  processes: string;

}


@Morphi.Repository(PROCESS)
export class PROCESS_REPOSITORY extends Morphi.Base.Repository<PROCESS, PROCESS_ALIASES> {


  globalAliases: (keyof PROCESS_ALIASES)[] = ['process', 'processes']


  async start(process: PROCESS): Promise<PROCESS> {

    const db = await TnpDB.Instance;


    let p = run(process.cmd, {
      biggerBuffer: true,
      output: false
    }).async()
    process.pid = p.pid;

    fse.writeFileSync(process.stdoutLogPath, '');
    fse.writeFileSync(process.stderLogPath, '');

    this.attachListeners(p, {
      msgAction: (chunk) => {
        fse.appendFileSync(process.stdoutLogPath, chunk)
        Morphi.Realtime.Server.TrigggerEntityChanges(process)
      },
      errorAction: (chunk) => {
        fse.appendFileSync(process.stderLogPath, chunk)
        Morphi.Realtime.Server.TrigggerEntityChanges(process)
      },
      endAction: async () => {
        Morphi.Realtime.Server.TrigggerEntityChanges(process)
      }
    })

    return process;
  }


  async stop(process: PROCESS): Promise<PROCESS> {
    try {
      killProcess(process.pid)
    } catch (error) {

    }
    process.pid = void 0;
    return process;
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
      childProcess.removeAllListeners();
    })

  }

}
//#endregion
