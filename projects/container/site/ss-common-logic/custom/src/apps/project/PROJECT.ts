import * as _ from 'lodash';
import { Project } from 'tnp-bundle'
import { Morphi, ModelDataConfig } from 'morphi';
import { IProjectController } from './ProjectController';
import { PROCESS } from 'baseline/ss-common-logic/src/apps/process/PROCESS';
import { Log } from 'ng2-logger';
export { IProject } from 'tnp-bundle';
import { IProject } from 'tnp-bundle';

const log = Log.create('PROJECT')

export interface IPROJECT extends IProject {
  procStaticBuild?: PROCESS;
  procWatchBuild?: PROCESS;
  procInitEnv?: PROCESS;
  procServeStatic?: PROCESS;
  procClear?: PROCESS;
}

@Morphi.Entity<PROJECT>({
  className: 'PROJECT',
  uniqueKeyProp: 'location',
  mapping: {
    procClear: 'PROCESS',
    procInitEnv: 'PROCESS',
    procServeStatic: 'PROCESS',
    procStaticBuild: 'PROCESS',
    procWatchBuild: 'PROCESS',
  },
  //#region @backend
  createTable: false,
  browserTransformFn: (entity: PROJECT) => {
    // entity.browser.procClear = entity.procClear;
    entity.browser['ada'] = 'asd'
    // console.log('Hellow from PROJECT transofrm chain')
    return entity;
  }
  //#endregion
})
export class PROJECT extends Project {

  procStaticBuild?: PROCESS;
  procWatchBuild?: PROCESS;
  procInitEnv?: PROCESS;
  procServeStatic?: PROCESS;
  procClear?: PROCESS;
  ctrl: IProjectController;
  browser: IPROJECT;

  async updaetAndGetProceses() {
    const data = await this.ctrl.getByLocation(this.location).received;
    Object
      .keys(data.body.json)
      .forEach(key => {
        if (key.startsWith('proc')) {
          log.i('update proc', key)
          this[key] = data.body.json[key];
        }
      });

  }

  static ctrl: IProjectController;
  static async getAll(config?: ModelDataConfig) {
    const data = await this.ctrl.getAll(config).received;
    return data.body.json;
    // this.projects.ch
  }

  static async getAllForMenu() {
    const data = await this.ctrl.getAllStandalone().received;
    return data.body.json;
  }


  static async getByLocation(location: string, config?: ModelDataConfig) {
    const data = await this.ctrl.getByLocation(location, config).received
    return data.body.json;
  }

}
