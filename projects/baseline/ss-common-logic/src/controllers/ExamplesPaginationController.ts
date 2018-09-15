import {
  ENDPOINT, OrmConnection, Connection, BaseCRUDEntity,
  GET, PathParam, Response, CLASSNAME, isBrowser
} from 'morphi';
import * as _ from 'lodash';
//#region @backend
import { authenticate } from 'passport';
import * as fs from 'fs';
import * as path from 'path';
//#endregion
// local
import { META } from 'morphi';

import * as entities from '../entities';
import * as controllers from '../controllers';

import { Log, Level } from "ng2-logger";
const log = Log.create('ExamplesController')

@ENDPOINT()
@CLASSNAME('ExamplesPaginationController')
export class ExamplesPaginationController extends META.BASE_CONTROLLER<entities.EXAMPLE_PAGINATION> {

  constructor() {
    super();
  }

  @BaseCRUDEntity(entities.EXAMPLE_PAGINATION) public entity: entities.EXAMPLE_PAGINATION;

  //#region @backend
  @OrmConnection connection: Connection;

  get db() {
    return entities.entities(this.connection as any);
  }

  get ctrl() {
    return controllers.controllers();
  }


  async initExampleDbData() {

    const promises = []

    _.times(25, (num) => {
      const obj = this.db.EXAMPLE_PAGINATION.create({
        name: `name${num}`,
        test: `tesst${num}`,
        age: 100 + num,
        isAmazing: (num % 2 === 0)
      });
      promises.push(this.db.EXAMPLE_PAGINATION.save(obj));
    })

    try {
      await Promise.all(promises);
      console.log('Pagination data inserted success')
    } catch (error) {
      console.log('Pagination data inserted fail')
    }

  }
  //#endregion


}


export default ExamplesPaginationController;
