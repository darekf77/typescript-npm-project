
import { Morphi } from 'morphi';

//#region @backend
import { authenticate } from 'passport'
//#endregion

import * as entities from '../../entities';
import * as controllers from '../../controllers';


export class IProcessController {
  killmeee: () => Morphi.Response<string>;
}


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


  //#region @backend

  get db() {
    return entities.entities(this.connection as any);
  }

  get ctrl() {
    return controllers.controllers()
  }


  async initExampleDbData() {

    let p1 = new entities.PROCESS()
    p1.id = 123
    await this.db.PROCESS.save(p1)
  }
  //#endregion

}
