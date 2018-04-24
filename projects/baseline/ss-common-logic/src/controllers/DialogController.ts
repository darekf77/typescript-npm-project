import { ENDPOINT, OrmConnection, Connection, BaseCRUDEntity } from 'morphi';
import { authenticate } from 'passport';
// local
import { META } from '../helpers';

import * as entities from '../entities';
import * as controllers from '../controllers';


@ENDPOINT({
  auth: (method) => {
    //#region @backendFunc
    return authenticate('bearer', { session: false });
    //#endregion
  }
})
export class DialogController extends META.BASE_CONTROLLER<entities.DIALOG> {

  //#region @backend
  @OrmConnection connection: Connection;

  @BaseCRUDEntity(entities.DIALOG) public entity: entities.DIALOG;

  get db() {
    return entities.entities(this.connection as any);
  }

  get ctrl() {
    return controllers.controllers()
  }
  
  //#endregion

}

export default DialogController;
