
import { ENDPOINT, CLASSNAME, BaseCRUDEntity, META } from 'morphi';
import { DOMAIN } from '../entities/DOMAIN';

import * as entities from '../entities';
import * as controllers from '../controllers';



@ENDPOINT()
@CLASSNAME('DomainsController')
export class DomainsController extends META.BASE_CONTROLLER<DOMAIN> {



  @BaseCRUDEntity(entities.DOMAIN) public entity: entities.DOMAIN;
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
