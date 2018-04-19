import { META } from '../helpers';
import { ENDPOINT, OrmConnection, Connection, BaseCRUDEntity } from 'morphi';
import { authenticate } from 'passport';
import { entities } from '../entities';
import { DIALOG } from '../entities/DIALOG';




@ENDPOINT({
  auth: (method) => {
    //#region @backendFunc
    return authenticate('bearer', { session: false });
    //#endregion
  }
})
export class DialogController extends META.BASE_CONTROLLER<DIALOG> {

  @BaseCRUDEntity(DIALOG) public entity: DIALOG;

  constructor() {
    super()
    this.db.USER.findOne
  }

}
