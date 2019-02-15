//#region @backend
import * as _ from 'lodash';
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


  start(process: PROCESS) {
    // let p = child.exec(`tnp ${process.cmd}`)
    // p.stdout.on('data', (data) => {
    //   child.exec('', {

    //   })
    // })
  }


  stop(process: PROCESS) {
    this.updateRealtime('')
  }

}
//#endregion
