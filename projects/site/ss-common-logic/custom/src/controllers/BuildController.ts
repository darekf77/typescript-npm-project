import { Morphi } from 'morphi';
import { BUILD } from '../entities/BUILD';
import * as _ from 'lodash';
import { EnvironmentName } from 'tnp-bundle'
//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as sleep from 'sleep';
//#endregion

import * as entities from '../entities';
import * as controllers from '../controllers';

@Morphi.Controller({
  className: 'BuildController'
})
export class BuildController extends Morphi.Base.Controller<BUILD> {

  @Morphi.Base.InjectCRUDEntity(entities.BUILD) public entity: entities.BUILD;
  //#region @backend

  get db() {
    return entities.entities(this.connection as any)
  }

  get ctrl() {
    return controllers.controllers()
  }


  async initExampleDbData() {


  }

  //#endregion

  @Morphi.Http.GET()
  getAll() {
    //#region @backendFunc
    console.log('here')
    return async () => {
      const build = new BUILD();
      return [
        build
      ] as any;
    }
    //#endregion
  }



}
