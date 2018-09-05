import { ENDPOINT } from 'morphi';
import { META } from 'baseline/ss-common-logic/src/helpers';
import { BUILD } from '../entities/BUILD';


//#region @backend
import * as _ from 'lodash';
import * as entitiesBaseline from 'baseline/ss-common-logic/src/entities';
import * as controllersBaseline from 'baseline/ss-common-logic/src/controllers';
import * as entitiesDecorators from '../entities-decorators';
import * as controllersDecorators from '../controllers-decorators';
//#endregion

@ENDPOINT()
export class BuildController extends META.BASE_CONTROLLER<BUILD> {

  //#region @backend
  get db() {
    return entitiesBaseline.entities(this.connection as any, entitiesDecorators.entities(this.connection as any))
  }

  get ctrl() {
    return controllersBaseline.controllers(controllersDecorators.controllers())
  }


  async initExampleDbData() {

    await this.db.BUILD.create({
      gitFolder: '/projects/baseline',
      gitRemote: 'https://github.com/darekf77/tsc-npm-project.git'
    })
  }
  //#endregion

}

export default BuildController;
