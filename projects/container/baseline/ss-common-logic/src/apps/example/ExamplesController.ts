import { Morphi } from 'morphi';
import { Log, Level } from "ng2-logger";
const log = Log.create('ExamplesController')


import * as entities from '../../entities';
import * as controllers from '../../controllers';


@Morphi.Controller({
  className: 'ExamplesController',
  entity: entities.EXAMPLE
})
export class ExamplesController extends Morphi.Base.Controller<entities.EXAMPLE> {

  constructor() {
    super();
    if (Morphi.IsBrowser) {
      log.i('ExamplesController, constructor', this)
    }
  }


  //#region @backend

  get db() {
    return entities.entities(this.connection as any);
  }

  get ctrl() {
    return controllers.controllers();
  }


  async initExampleDbData() {

    const c1 = this.db.EXAMPLE.create({
      test: 'Amazing Example !',
      href: 'Amazing Href',
      name: 'C1 name'
    });

    const c2 = this.db.EXAMPLE.create({
      test: 'Super Example !',
      href: 'Amazing Href 2',
      name: 'C2 name'
    });

    await this.db.EXAMPLE.save([c1, c2]);

  }
  //#endregion


  @Morphi.Http.GET('/dupa')
  info2(): Morphi.Response<any> {
    //#region @backendFunc
    return {
      send: {
        hello: 'uuuuu'
      }
    };
    //#endregion
  }

}

