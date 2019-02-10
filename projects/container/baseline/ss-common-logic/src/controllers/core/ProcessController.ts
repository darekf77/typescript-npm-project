
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

  get db() {
    return entities.entities(this.connection as any);
  }

  get ctrl() {
    return controllers.controllers()
  }


  //#endregion

}
