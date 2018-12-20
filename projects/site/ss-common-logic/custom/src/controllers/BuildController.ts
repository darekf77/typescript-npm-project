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
  className: 'BuildController',
  entity: entities.BUILD
})
export class BuildController extends Morphi.Base.Controller<entities.BUILD> {

  //#region @backend

  get db() {
    return entities.entities(this.connection as any)
  }

  get ctrl() {
    return controllers.controllers()
  }


  async initExampleDbData() {
    // let builds = await this.db.BUILD.getBuilds()
    // console.log('builds', builds)

  }

  //#endregion

  @Morphi.Http.GET()
  heelooeoe(): Morphi.Response<any> {
    //#region @backendFunc
    return { send: 'uhuhu' }
    //#endregion
  }

  @Morphi.Http.GET()
  getAll(): Morphi.Response<any> {
    //#region @backendFunc
    console.log('here')

    return async () => {
      let builds = await this.db.BUILD.getBuilds()
      // console.log('builds', builds)
      return [_.first(builds)] ; //   builds;
    }
    //#endregion
  }



}
