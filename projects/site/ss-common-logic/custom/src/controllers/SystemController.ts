import {
  CategoryController as BaselineCategoryController
} from 'baseline/ss-common-logic/src/controllers/CategoryController';
import { Morphi } from 'morphi';

//#region @backend
import * as fse from 'fs-extra';
import * as sleep from 'sleep';
import * as psList from 'ps-list';
//#endregion

import * as entities from '../entities';
import * as controllers from '../controllers';
import { PROGRESS_BAR_DATA, EnvironmentName } from 'tnp-bundle';
import { SelfUpdate, TNP_PROJECT } from '../entities/TNP_PROJECT';
import { Subject } from 'rxjs/Subject';



@Morphi.Controller({
  className: 'SystemController',
  entity: entities.SYSTEM_INFO
})
export class SystemController extends Morphi.Base.Controller<entities.SYSTEM_INFO> {


  @Morphi.Http.GET('/test')
  test(): Morphi.Response<any> {
    //#region @backendFunc
    return async () => {
      return await psList()
    }
    //#endregion
  }


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
