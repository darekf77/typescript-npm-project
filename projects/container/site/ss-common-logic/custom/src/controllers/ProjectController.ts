import { Morphi } from 'morphi';


import * as entities from '../entities';
import * as controllers from '../controllers';


@Morphi.Controller({
  className: 'ProjectController',
  entity: entities.PROJECT
})
export class ProjectController extends Morphi.Base.Controller<entities.PROJECT> {

  //#region @backend

  get db() {
    return entities.entities(this.connection as any)
  }

  get ctrl() {
    return controllers.controllers()
  }

  @Morphi.Http.GET()
  getAll() {

  }

  async initExampleDbData() {
    // console.log('Don not init this! OK ')

  }
  //#endregion


}
