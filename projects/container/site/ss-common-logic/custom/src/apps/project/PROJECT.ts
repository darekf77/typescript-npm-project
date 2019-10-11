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
const log = Log.create('PROJECT');

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
    // const project = PROJECT.createFrom(entity);
    entity.browser.selectedEnv = PROJECT.getProjectEnv(entity);
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
    // @QUICK_FIX this is how to extend unknow class with new methods
    Object.keys(PROJECT.prototype).forEach(key => {
      console.log(key)
      if (typeof classFn.prototype[key] === 'undefined') {
        classFn.prototype[key] = PROJECT.prototype[key]
      }
    });
    return obj;
  }

  set selectedIndex(v: number) {
    this._selectedIndex = v;
    this.selectedTabChanged.next(v)
  }

  get selectedIndex() {
    return this._selectedIndex;
  }

  private _selectedIndex = 0;
  get selectedEnv(): string {
    return this.browser.selectedEnv;
  }

  set selectedEnv(v) {
    this.browser.selectedEnv = v;
  }

  //#region @backend
  static getProjectEnv(project: Project) {
    let wasNulled = false;
    let result: any;
    if (project.env && project.env['project'] === null) {
      wasNulled = true;
      project.env['project'] = project;
    }
    result = project.env && project.env.config && project.env.config.name;
    if (wasNulled) {
      project.env['project'] = null;
    }
    return result;
  }
  //#endregion


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
      this.envionments = data.body.json.filter(f => f !== 'local');
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
