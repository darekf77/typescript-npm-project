import {
  CategoryController as BaselineCategoryController
} from 'baseline/ss-common-logic/src/controllers/CategoryController';
import { Morphi } from 'morphi';

//#region @backend
import * as fse from 'fs-extra';
import * as sleep from 'sleep';
//#endregion

import * as entities from '../entities';
import * as controllers from '../controllers';
import { PROGRESS_BAR_DATA, EnvironmentName } from 'tnp-bundle';
import { SelfUpdate, TNP_PROJECT } from '../entities/TNP_PROJECT';
import { Subject } from 'rxjs/Subject';


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

  async initExampleDbData() {
    // console.log('Don not init this! OK ')

  }
  //#endregion


}
