import {
  ENDPOINT, OrmConnection, Connection,
  BaseCRUDEntity,
  CLASSNAME, META
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
@CLASSNAME('GroupsController')
export class GroupsController extends META.BASE_CONTROLLER<entities.GROUP> {

  @BaseCRUDEntity(entities.GROUP) public entity: entities.GROUP;

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


export default GroupsController;
