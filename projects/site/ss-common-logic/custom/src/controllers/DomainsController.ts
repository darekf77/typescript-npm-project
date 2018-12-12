
import { Morphi } from 'morphi';
import { DOMAIN } from '../entities/DOMAIN';

import * as entities from '../entities';
import * as controllers from '../controllers';



@Morphi.Controller({
  className: 'DomainsController'
})
export class DomainsController extends Morphi.Base.Controller<DOMAIN> {



  @Morphi.Base.InjectCRUDEntity(entities.DOMAIN) public entity: entities.DOMAIN;
  //#region @backend

  get db() {
    return entities.entities(this.connection as any)
  }

  get ctrl() {
    return controllers.controllers()
  }

  async initExampleDbData() {
    // console.log('Don not init this! OK ')



  }

  //#endregion

}
