import { ENDPOINT, OrmConnection, Connection, BaseCRUDEntity, GET, PathParam, Response, CLASSNAME, isBrowser } from 'morphi';
//#region @backend
import { authenticate } from 'passport';
import * as fs from 'fs';
import * as path from 'path';
//#endregion
// local
import { META } from '../helpers';

import * as entities from '../entities';
import * as controllers from '../controllers';

import { Log, Level } from "ng2-logger";
const log = Log.create('ExamplesController')

@ENDPOINT()
@CLASSNAME('ExamplesController')
export class ExamplesController extends META.BASE_CONTROLLER<entities.EXAMPLE> {

  constructor() {
    super();
    if (isBrowser) {
      log.i('ExamplesController, constructor', this)
    }
  }

  @BaseCRUDEntity(entities.EXAMPLE) public entity: entities.EXAMPLE;

  //#region @backend
  @OrmConnection connection: Connection;

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


  @GET('/dupa')
  info2(): Response<any> {
    //#region @backendFunc
    return {
      send: {
        hello: 'uuuuu'
      }
    };
    //#endregion
  }

}


export default ExamplesController;
