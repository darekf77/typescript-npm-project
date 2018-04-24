import { ENDPOINT, OrmConnection, Connection, BaseCRUDEntity } from 'morphi';
import { authenticate } from 'passport';
// local
import { META } from '../helpers';
import { DIALOG } from '../entities/DIALOG';
//#region @backend
import * as entities from '../entities';
import * as controllers from '../controllers';
//#endregion

@ENDPOINT({
  auth: (method) => {
    //#region @backendFunc
    return authenticate('bearer', { session: false });
    //#endregion
  }
})
export class DialogController extends META.BASE_CONTROLLER<DIALOG> {

  //#region @backend
  @OrmConnection connection: Connection;

  @BaseCRUDEntity(DIALOG) public entity: entities.DIALOG;

  get db() {
    return entities.entities(this.connection as any);
  }
  //#endregion

}

export default DialogController;
