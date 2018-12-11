import { Morphi } from 'morphi';
import { Log } from 'ng2-logger';

const log = Log.create('CondigController')

import * as entities from '../entities';
import * as controllers from '../controllers';

//#region @backend
import { authenticate } from 'passport'
//#endregion

export type APP_LANGUAGE = 'pl' | 'en' | 'fr';

export interface ConfigValues {
  course_client_language: APP_LANGUAGE;
  course_target_language: APP_LANGUAGE;

}

const APP_CONFIG: ConfigValues = Object.freeze<ConfigValues>({
  course_client_language: 'pl',
  course_target_language: 'fr'
})

@Morphi.Controller({
  className: 'ConfigController',
  //#region @backend
  auth: () => {
    return authenticate('bearer', { session: false });
  }
  //#endregion
})
export class ConfigController extends Morphi.Base.Controller<entities.CONFIG> {

  @Morphi.Base.InjectCRUDEntity(entities.CONFIG) public entity: entities.CONFIG;

  //#region @backend
  @Morphi.Orm.InjectConnection connection: Morphi.Orm.Connection;

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
    if (Morphi.IsBrowser) {
      const config = await this.getAll().received;
      config.body.json.forEach(({ key, value }) => {
        ConfigController.cachedValues[key] = value;
      })
    }

  }


  private static cachedValues: ConfigValues = {} as any;
  public get instance() {
    return new Promise<ConfigValues>(async (resolve) => {
      // if (Object.keys(ConfigController.cachedValues).length > 0) {
      //   return ConfigController.cachedValues;
      // } else {
      await this.refresh()
      // }
      resolve(ConfigController.cachedValues);
    });
  }

}

