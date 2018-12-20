
import { Morphi } from 'morphi';


import * as entities from '../entities';
import * as controllers from '../controllers';



@Morphi.Controller({
  className: 'DomainsController',
  entity: entities.DOMAIN
})
export class DomainsController extends Morphi.Base.Controller<entities.DOMAIN> {


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
