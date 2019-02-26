import { Morphi } from 'morphi';

//#region @backend
import { authenticate } from 'passport';
//#endregion


import * as entities from '../../entities';
import * as controllers from '../../controllers';


@Morphi.Controller({
  className: 'DialogsController',
  entity: entities.DIALOG,
  //#region @backend
  auth: () => {
    return authenticate('bearer', { session: false });
  }
  //#endregion
})
export class DialogsController extends Morphi.Base.Controller<entities.DIALOG> {


  //#region @backend

  get db() {
    return entities.entities(this.connection as any);
  }

  get ctrl() {
    return controllers.controllers()
  }


  async initExampleDbData() {

  }
  //#endregion


}

