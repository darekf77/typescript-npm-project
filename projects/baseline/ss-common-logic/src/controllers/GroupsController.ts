import { Morphi } from 'morphi';


//#region @backend
import { authenticate } from 'passport';
//#endregion


import * as entities from '../entities';
import * as controllers from '../controllers';



@Morphi.Controller({
  className: 'GroupsController',
  //#region @backend
  auth: () => {
    return Morphi.Auth('bearer', { session: false });
  }
  //#endregion
})
export class GroupsController extends Morphi.Base.Controller<entities.GROUP> {

  @Morphi.Base.InjectCRUDEntity(entities.GROUP) public entity: entities.GROUP;

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

