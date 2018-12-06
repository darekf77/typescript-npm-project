import {
  ENDPOINT, CLASSNAME, BaseCRUDEntity, META,
  POST, PathParam, QueryParam, GET, Response, PUT, ModelDataConfig
} from 'morphi';
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

@ENDPOINT()
@CLASSNAME('BuildController')
export class BuildController extends META.BASE_CONTROLLER<BUILD> {

  @BaseCRUDEntity(entities.BUILD) public entity: entities.BUILD;
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




}
