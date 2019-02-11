
import { Morphi } from 'morphi';

//#region @backend
import { authenticate } from 'passport'
//#endregion

import * as entities from '../../entities';
import * as controllers from '../../controllers';
import { PROCESS } from '../../entities/core/PROCESS';


export interface IProcessController extends ProcessController { }


@Morphi.Controller({
  className: 'ProcessController',
  entity: entities.PROCESS,
  //#region @backend
  // auth: () => {
  //   return authenticate('bearer', { session: false });
  // }
  //#endregion
})
export class ProcessController extends Morphi.Base.Controller<entities.PROCESS> {

  @Morphi.Http.GET('/killme')
  killmeee(): Morphi.Response<string> {
    //#region @backendFunc
    return { send: 'super!!!!!' }
    //#endregion

  }

  @Morphi.Http.GET('/start/:pid')
  start(@Morphi.Http.Param.Path('pid') pid: number): Morphi.Response<string> {
    //#region @backendFunc
    return { send: 'started!' }
    //#endregion

  }

  @Morphi.Http.GET('/start/:pid')
  stop(@Morphi.Http.Param.Path('pid') pid: number): Morphi.Response<string> {
    //#region @backendFunc
    return { send: 'stopped!' }
    //#endregion

  }

  @Morphi.Http.GET()
  getAll(): Morphi.Response<PROCESS[]> {
    //#region @backendFunc
    return async (req, res) => {
      let p = new PROCESS()
      p.pid = 1111;
      let p2 = new PROCESS()
      p2.pid = 2222;
      return [p, p2]
    }
    //#endregion
  }


  //#region @backend

  get ctrl() {
    return controllers.controllers()
  }


  //#endregion

}
