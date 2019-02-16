
import { Morphi } from 'morphi';

//#region @backend
import { authenticate } from 'passport'
//#endregion

import * as entities from '../../entities';
import * as controllers from '../../controllers';
import { PROCESS } from '../../entities/core/PROCESS';



export interface IProcessController extends ProcessController { }


@Morphi.Controller({
  className: 'ProcessController',
  entity: entities.PROCESS,
  //#region @backend
  // auth: () => {
  //   return authenticate('bearer', { session: false });
  // }
  //#endregion
})
export class ProcessController extends Morphi.Base.Controller<entities.PROCESS> {

  @Morphi.Http.GET('/killme')
  killmeee(): Morphi.Response<string> {
    //#region @backendFunc
    return { send: 'super!!!!!' }
    //#endregion

  }

  @Morphi.Http.POST('/start')
  start(@Morphi.Http.Param.Body('process') process: PROCESS): Morphi.Response<PROCESS> {
    //#region @backendFunc
    return async () => {
      return await this.db.PROCESS.start(process);
    }
    //#endregion

  }

  @Morphi.Http.POST('/stop')
  stop(@Morphi.Http.Param.Body('process') process: PROCESS): Morphi.Response<PROCESS> {
    //#region @backendFunc
    return async () => {
      return await this.db.PROCESS.stop(process);
    }
    //#endregion

  }


  //#region @backend
  get ctrl() {
    return controllers.controllers()
  }

  get db() {
    // @ts-ignore
    return entities.entities(this.connection as any);
  }

  async initExampleDbData() {
    let p = new PROCESS({ name: 'Test process i', cmd: 'echo "hello world"' })
    await this.db.PROCESS.save(p)
  }

  //#endregion

}
