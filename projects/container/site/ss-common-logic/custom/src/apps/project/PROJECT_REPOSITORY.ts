//#region @backend
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as child from 'child_process';
import axios from 'axios';
import { Morphi, ModelDataConfig } from "morphi";
import { PROJECT, IPROJECT } from "./PROJECT";
import { TnpDB, ProjectFrom } from 'tnp-bundle';
import { PROCESS } from 'baseline/ss-common-logic/src/apps/process/PROCESS';


export interface TNP_PROJECT_ALIASES {
  project: string;
  projects: string;
}

@Morphi.Repository(PROJECT)
export class PROJECT_REPOSITORY extends Morphi.Base.Repository<PROJECT, TNP_PROJECT_ALIASES> {
  globalAliases: (keyof TNP_PROJECT_ALIASES)[] = ['project', 'projects']

  async getAllProjects(config?: ModelDataConfig) {
    const db = await TnpDB.Instance;
    const projects = db.getProjects();
    const mapped = projects.map(p => {
      let res = p.project;
      res.modelDataConfig = config as any;
      return res as any;
    })
    for (let index = 0; index < mapped.length; index++) {
      const p = mapped[index];
      await this.addProcessesToModel(p as any);
    }
    return mapped.map(p => PROJECT.from(p));
  }

  async getByLocation(location: string, config?: ModelDataConfig) {
    let res = ProjectFrom(decodeURIComponent(location));
    res.modelDataConfig = config as any;
    await this.addProcessesToModel(res as any);
    return PROJECT.from(res)
  }


  private async addProcessesToModel(project: PROJECT) {
    const db = await TnpDB.Instance;


    await this.assignProc(project, db, 'procStaticBuild', {
      cmd: 'tnp build:dist',
      cwd: project.location,
      async: true,
      name: `Static Build of project ${project.name}`
    })

    await this.assignProc(project, db, 'procWatchBuild', {
      cmd: 'tnp build:dist:watch',
      cwd: project.location,
      async: true,
      name: `Watch build of project ${project.name}`
    });

    await this.assignProc(project, db, 'procServeStatic', {
      cmd: 'tnp start',
      cwd: project.location,
      async: true,
      name: `Server staticlyu project ${project.name}`
    })

    await this.assignProc(project, db, 'procInitEnv', {
      cmd: 'tnp init --env=%s',
      cwd: project.location,
      async: false,
      name: `Init environment of project ${project.name}`
    });

    await this.assignProc(project, db, 'procClear', {
      cmd: 'tnp clear:%s',
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

  private async assignProc(
    p: PROJECT, db: TnpDB,
    property: (keyof PROJECT),
    processOptions: { name: string; cmd: string; cwd?: string; async?: boolean }) {

    if (p.modelDataConfig && _.isArray(p.modelDataConfig.include) &&
      p.modelDataConfig.include.length > 0 &&
      !p.modelDataConfig.include.includes(property)) {
      return
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

    await db.transaction.boundActions(
      async () => {
        return { metaInfo, relation1TO1entityId }
      },
      async (proc) => {
        let toSave = { metaInfo, relation1TO1entityId };
        relation1TO1entityId = proc.relation1TO1entityId;
        if (_.isNumber(relation1TO1entityId)) {
          processInDB = await PROCESS.getByID(relation1TO1entityId)
        }
        if (processInDB) {
          toSave = void 0;
        } else {
          processInDB = new PROCESS(processOptions);
          processInDB = await PROCESS.save(processInDB);
          relation1TO1entityId = processInDB.id;
          toSave.relation1TO1entityId = relation1TO1entityId;
        }
        p[property as any] = processInDB;
        return toSave;
      }
    )

  }

}


//#endregion
