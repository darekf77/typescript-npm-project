import * as _ from 'lodash';
import { Project, EnvironmentName } from 'tnp-bundle'
import { Morphi, ModelDataConfig } from 'morphi';
import { IProjectController } from './ProjectController';
import { PROCESS } from 'baseline/ss-common-logic/src/apps/process/PROCESS';
import { Log } from 'ng2-logger';
export { IProject } from 'tnp-bundle';
import { IProject } from 'tnp-bundle';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CLASS } from 'typescript-class-helpers';
const log = Log.create('PROJECT')

export interface IPROJECT extends IProject {
  procStaticBuild?: PROCESS;
  procWatchBuild?: PROCESS;
  procInitEnv?: PROCESS;
  procServeStatic?: PROCESS;
  procClear?: PROCESS;
  selectedEnv?: string;
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
  additionalMapping: {
    'browser.procClear': 'PROCESS',
    'browser.procInitEnv': 'PROCESS',
    'browser.procServeStatic': 'PROCESS',
    'browser.procStaticBuild': 'PROCESS',
    'browser.procWatchBuild': 'PROCESS',
  },
  //#region @backend
  createTable: false,
  browserTransformFn: (entity: PROJECT) => {
    // entity = PROJECT.createFrom(entity);
    // entity.browser.selectedEnv = entity.getProjectEnv()
    return entity;
  }
  //#endregion
})
export class PROJECT extends Project {
  static createFrom(obj: any): PROJECT {
    const classFn: Function = CLASS.getFromObject(obj);
    if (!classFn) {
      return obj;
    }
    return _.merge(new PROJECT(), obj);
  }

  set selectedIndex(v: number) {
    this._selectedIndex = v;
    this.selectedTabChanged.next(v)
  }

  get selectedIndex() {
    return this._selectedIndex;
  }

  private _selectedIndex = 0;
  selectedEnv: string;


  getProjectEnv() {
    if (Morphi.IsBrowser) {
      return this.selectedEnv;
    }
    //#region @backend
    return this.env && this.env.config && this.env.config.name;
    //#endregion
  }


  selectedTabChanged = new BehaviorSubject<number>(0)
  procStaticBuild?: PROCESS;
  procWatchBuild?: PROCESS;
  procInitEnv?: PROCESS;
  procServeStatic?: PROCESS;
  procClear?: PROCESS;
  ctrl: IProjectController;
  browser: IPROJECT;

  envionments: EnvironmentName[] = [];

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
    const data = await this.ctrl.getByLocation(location).received
    return data.body.json;
  }

  async updateEndGetEnvironments() {
    try {
      const data = await this.ctrl.getEnvironments(this.location).received;
      this.envionments = data.body.json;
    } catch (error) { }
  }


  async updaetAndGetProceses() {
    const data = await this.ctrl.getByLocation(this.location).received;
    Object
      .keys(data.body.json)
      .forEach(key => {
        if (key.startsWith('proc')) {
          // log.i('update proc', key)
          this[key] = data.body.json[key];
        }
      });
    log.i('Update project', this)

  }


}
