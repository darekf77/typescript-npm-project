import { Morphi } from 'morphi';

//#region @backend
import * as path from "path";
import * as fse from "fs-extra";
//#endregion

import { IProcessController } from '../../controllers/core/ProcessController';



export interface IPROCESS {

  /**
   * pid of process
   */
  id: number;
}




@Morphi.Entity<PROCESS>({
  className: 'PROCESS'
})
export class PROCESS extends Morphi.Base.Entity<PROCESS, IPROCESS, IProcessController> implements IPROCESS {


  //#region @backend
  @Morphi.Orm.Column.Primary()
  //#endregion
  id: number;




  async kill() {
    console.log(this)
    let res = await this.ctrl.killmeee().received;
    console.log(`Controlelr in entity test!!!! ${res.body.text}`)
  }

}
