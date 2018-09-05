import { ENDPOINT } from 'morphi';
import { META } from 'baseline/ss-common-logic/src/helpers';
import { BUILD } from '../entities/BUILD';


//#region @backend
import * as entities from '../entities';
import * as controllers from '../controllers';
//#endregion

@ENDPOINT()
export class BuildController extends META.BASE_CONTROLLER<BUILD> {

  //#region @backend
  get db() {
    return entities.entities(this.connection as any)
  }

  get ctrl() {
    return controllers.controllers()
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
