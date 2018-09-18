import {
  ENDPOINT, OrmConnection, Connection,
  BaseCRUDEntity,
  META,
  CLASSNAME
} from 'morphi';

//#region @backend
import { authenticate } from 'passport';
//#endregion


import * as entities from '../entities';
import * as controllers from '../controllers';


@ENDPOINT({
  auth: () => {
    //#region @backendFunc
    return authenticate('bearer', { session: false });
    //#endregion
  }
})
@CLASSNAME('DialogsController')
export class DialogsController extends META.BASE_CONTROLLER<entities.DIALOG> {

  @BaseCRUDEntity(entities.DIALOG) public entity: entities.DIALOG;

  //#region @backend
  @OrmConnection connection: Connection;

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


export default DialogsController;
