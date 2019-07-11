import { Morphi } from 'morphi';


//#region @backend
import { authenticate } from 'passport';
//#endregion


import * as entities from '../../entities';
import * as controllers from '../../controllers';

console.log('aaaaaaaaa')
@Morphi.Controller({
  className: 'GroupsController',
  entity: entities.GROUP,
  //#region @backend
  auth: () => {
    return authenticate('bearer', { session: false });
  }
  //#endregion
})
export class GroupsController extends Morphi.Base.Controller<entities.GROUP> {


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

