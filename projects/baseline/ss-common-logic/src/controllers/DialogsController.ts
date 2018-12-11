import { Morphi } from 'morphi';

//#region @backend
import { authenticate } from 'passport';
//#endregion


import * as entities from '../entities';
import * as controllers from '../controllers';


@Morphi.Controller({
  className: 'DialogsController',
  //#region @backend
  auth: () => {
    return authenticate('bearer', { session: false });
  }
  //#endregion
})
export class DialogsController extends Morphi.Base.Controller<entities.DIALOG> {

  @Morphi.Base.InjectCRUDEntity(entities.DIALOG) public entity: entities.DIALOG;

  //#region @backend
  @Morphi.Orm.InjectConnection connection: Morphi.Orm.Connection;

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

