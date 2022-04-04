//#region isomorphic
import { _ } from 'tnp-core';
import { Models } from 'tnp-models';
import { Morphi, ModelDataConfig } from 'morphi';
import { Project } from 'tnp-helpers';
import { CLASS } from 'typescript-class-helpers';
import { PROCESS } from '../process/PROCESS';
import { Log } from 'ng2-logger';
import { config, ConfigModels } from 'tnp-config';
import type { ProjectController } from './ProjectController';
//#endregion

//#region @backend
import { TnpDB } from 'tnp-db';
import { fse } from 'tnp-core'
import { glob } from 'tnp-core';
import { path } from 'tnp-core'
import { child_process } from 'tnp-core';
import axios from 'axios';
//#endregion
import { BehaviorSubject } from 'rxjs';
const log = Log.create('PROJECT');

export interface IPROJECT extends Project {
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
  } as any,
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
    entity.browser.selectedEnv = PROJECT.getProjectEnv(entity as any);
    return entity;
  }
  //#endregion
})
export class PROJECT extends Project {
  static readonly ctrl: ProjectController;
  readonly ctrl: ProjectController;
  readonly browser: PROJECT;
  public procStaticBuild?: PROCESS;
  public procWatchBuild?: PROCESS;
  public procInitEnv?: PROCESS;
  public procServeStatic?: PROCESS;
  public procClear?: PROCESS;
  public selectedTabChanged = new BehaviorSubject<number>(0);
  public readonly envionments: ConfigModels.EnvironmentName[] = [];
  private _selectedIndex = 0;

  public static async getAllProjects() {
    //#region @backendFunc
    const db = await TnpDB.Instance();
    const projects = await db.getProjects();
    const mapped = projects
      .filter(p => !!p.project)
      .map(p => {
        const res = p.project;
        return res as any;
      });
    for (let index = 0; index < mapped.length; index++) {
      const p = mapped[index];
      await addProcessesToModel(p as any);
    }
    return mapped;
    //#endregion
  }
  public static async getAll(config?: ModelDataConfig) {
    //#region @backend
    if (Morphi.isNode) {
      return await PROCESS.db.getAll();
    }
    //#endregion
    const data = await this.ctrl.getAll(config).received;
    return data.body.json;
  }

  public static async getAllForMenu() {
    if (this.ctrl.getAllStandalone().received.cache) {
      const data = this.ctrl.getAllStandalone().received.cache.response;
      return data.body.json;
    }
    const data = await this.ctrl.getAllStandalone().received;
    data.cache.store();
    return data.body.json;
  }

  public static async getByLocation(location: string, pconfig?: ModelDataConfig): Promise<PROJECT> {
    //#region @backend
    if (Morphi.isNode) {
      const res = Project.From(decodeURIComponent(location));
      await addProcessesToModel(res as any);
      return res as any;
    }
    //#endregion
    const data = await this.ctrl.getByLocation(location).received
    return data.body.json;
  }

  private static createFrom(obj: any): PROJECT {
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

  private static getProjectEnv(project: Project) {
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

  public set selectedIndex(v: number) {
    this._selectedIndex = v;
    this.selectedTabChanged.next(v)
  }

  public get selectedIndex() {
    return this._selectedIndex;
  }


  public get selectedEnv(): string {
    return this.browser.selectedEnv;
  }

  public set selectedEnv(v) {
    this.browser.selectedEnv = v;
  }


  public namesFrom(): ConfigModels.EnvironmentName[] {
    //#region @backendFunc
    const patter = `${this.location}/${config.file.environment}.*`;
    let names = glob
      .sync(patter)
      .filter(f => f.split('.').pop() === 'js')
      .map(f => path
        .basename(f)
        .replace(`${config.file.environment}.`, '')
        .replace(/\.?js$/, '')
      )
      .map(f => f.trim() === '' ? 'local' : f)

    return names as any;
    //#endregion
  }

  public async updateEndGetEnvironments() {
    try {
      const data = await this.ctrl.getEnvironments(this.location).received;
      // @ts-ignore
      this.envionments = data.body.json.filter(f => f !== 'local');
    } catch (error) { }
  }


  public async updaetAndGetProceses() {
    const data = await this.ctrl.getByLocation(this.location).received;
    Object
      .keys(data.body.json)
      .forEach(key => {
        if (key.startsWith('proc')) {
          // log.i('update proc', key)
          this[key] = data.body.json[key];
        }
      });
    log.i('Update project', this);
  }
}

//#region @backend

async function addProcessesToModel(project: PROJECT) {
  const db = await TnpDB.Instance();

  if (!project) {
    return // TODO QUICK_FIX
  }

  await assignProc(project, db, 'procStaticBuild', {
    // cmd: '${config.frameworkName} build:dist',
    cmd: `${config.frameworkName} staticbuild --env={env} --tnpShowProgress`,
    cwd: project.location,
    async: true,
    name: `Static Build of project ${project.name}`
  })

  await assignProc(project, db, 'procWatchBuild', {
    // cmd: '${config.frameworkName} build:dist:watch',
    cmd: `${config.frameworkName} show:loop:messages --max 6 --tnpShowProgress`,
    cwd: project.location,
    async: true,
    name: `Watch build of project ${project.name}`
  });

  await assignProc(project, db, 'procServeStatic', {
    cmd: `${config.frameworkName} show:loop:messages --max 6 --tnpShowProgress`,
    // cmd: '${config.frameworkName} start',
    cwd: project.location,
    async: true,
    name: `Server staticlyu project ${project.name}`
  })

  await assignProc(project, db, 'procInitEnv', {
    cmd: `${config.frameworkName} show:loop:messages --max 6 --tnpShowProgress`,
    // cmd: '${config.frameworkName} init --env=%s',
    cwd: project.location,
    async: false,
    name: `Init environment of project ${project.name}`
  });

  await assignProc(project, db, 'procClear', {
    cmd: `${config.frameworkName} show:loop:messages --max 6 --tnpShowProgress`,
    // cmd: '${config.frameworkName} clear:%s',
    cwd: project.location,
    async: false,
    name: `Clear project ${project.name}`
  });

  // if (project.parent) {
  //   await this.addProcessesToModel(project.parent as PROJECT)
  // }

  // if (project.children) {
  //   for (let index = 0; index < project.children.length; index++) {
  //     const child = project.children[index];
  //     await this.addProcessesToModel(child as PROJECT)
  //   }
  // }
}
//#endregion

//#region @backend
async function assignProc(
  p: any, db: TnpDB,
  property: (keyof PROJECT),
  processOptions: { name: string; cmd: string; cwd?: string; async?: boolean }) {

  if (p.modelDataConfig && _.isArray(p.modelDataConfig.include) &&
    p.modelDataConfig.include.length > 0 &&
    !p.modelDataConfig.include.includes(property)) {
    return;
  }

  let processInDB: PROCESS;
  let relation1TO1entityId: number;

  const metaInfo = {
    className: 'PROJECT',
    entityId: p.location,
    entityProperty: property,
    pid: void 0,
    cmd: void 0,
    cwd: void 0
  };

  await db.boundActions(
    async () => {
      return { metaInfo, relation1TO1entityId }
    },
    async (proc) => {
      let toSave = { metaInfo, relation1TO1entityId };
      relation1TO1entityId = proc.relation1TO1entityId;
      if (_.isNumber(relation1TO1entityId)) {
        var { model: processInDB } = await PROCESS.db.getBy(relation1TO1entityId)
      }
      if (processInDB) {
        toSave = void 0;
      } else {
        processInDB = new PROCESS(processOptions);
        processInDB = await PROCESS.db.create(processInDB);
        relation1TO1entityId = processInDB.id;
        toSave.relation1TO1entityId = relation1TO1entityId;
      }
      p[property as any] = processInDB;
      return toSave;
    }
  )

}
//#endregion
