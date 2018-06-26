import { ENDPOINT, OrmConnection, Connection, BaseCRUDEntity, GET, PathParam, Response, CLASSNAME } from 'morphi';
//#region @backend
import { authenticate } from 'passport';
import * as fs from 'fs';
import * as path from 'path';
//#endregion
// local
import { META } from '../helpers';

import * as entities from '../entities';
import * as controllers from '../controllers';


@ENDPOINT()
@CLASSNAME('ExamplesController')
export class ExamplesController extends META.BASE_CONTROLLER<entities.EXAMPLE> {

  //#region @backend
  @OrmConnection connection: Connection;

  @BaseCRUDEntity(entities.EXAMPLE) public entity: entities.EXAMPLE;

  get db() {
    return entities.entities(this.connection as any);
  }

  get ctrl() {
    return controllers.controllers()
  }


  async initExampleDbData() {

    const c1 = this.db.EXAMPLE.create({
      test: 'Amazing Example !'
    })

    const c2 = this.db.EXAMPLE.create({
      test: 'Super Example !'
    })

    await this.db.EXAMPLE.save([c1, c2])

  }
  //#endregion



}


export default ExamplesController;
