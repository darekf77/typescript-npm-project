import {
  ENDPOINT, OrmConnection, Connection,
  BaseCRUDEntity,
  GET, SYMBOL,
  PathParam,
  Response, CLASSNAME, isBrowser, getSingleton
} from 'morphi';
//#region @backend
import { authenticate } from 'passport';
import * as fs from 'fs';
import * as path from 'path';
//#endregion
// local
import { META } from '../helpers';

import { Log, Logger } from 'ng2-logger';
const log = Log.create('CondigController')

import * as entities from '../entities';
import * as controllers from '../controllers';

export type APP_LANGUAGE = 'pl' | 'en' | 'fr';

export interface ConfigValues {
  course_client_language: APP_LANGUAGE;
  course_target_language: APP_LANGUAGE;

}

const APP_CONFIG: ConfigValues = Object.freeze<ConfigValues>({
  course_client_language: 'pl',
  course_target_language: 'fr'
})

@ENDPOINT({
  auth: (method) => {
    //#region @backendFunc
    return authenticate('bearer', { session: false });
    //#endregion
  }
})
@CLASSNAME('ConfigController')
export class ConfigController extends META.BASE_CONTROLLER<entities.CONFIG> {

  @BaseCRUDEntity(entities.CONFIG) public entity: entities.CONFIG;

  //#region @backend
  @OrmConnection connection: Connection;

  get db() {
    return entities.entities(this.connection as any);
  }

  get ctrl() {
    return controllers.controllers()
  }


  async initExampleDbData() {

    const promises = []
    Object.keys(APP_CONFIG).forEach(key => {
      promises.push(this.db.CONFIG.save(this.db.CONFIG.create({
        key,
        value: APP_CONFIG[key]
      })));
    });
    await Promise.all(promises);
    log.i('App config updated successfully');
  }
  //#endregion

  private async refresh() {

    const config = await this.getAll().received;
    config.body.json.forEach(({ key, value }) => {
      ConfigController.cachedValues[key] = value;
    })
  }


  private static cachedValues: ConfigValues = {} as any;
  public get instance() {
    return new Promise<ConfigValues>(async (resolve, reject) => {
      // if (Object.keys(ConfigController.cachedValues).length > 0) {
      //   return ConfigController.cachedValues;
      // } else {
      await this.refresh()
      // }
      resolve(ConfigController.cachedValues);
    });
  }

}


export default ConfigController;
