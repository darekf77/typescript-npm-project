//#region @backend
import * as low from 'lowdb';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as FileSync from 'lowdb/adapters/FileSync'


import { Project } from '../project/base-project';
import { BuildOptions } from '../models';
import { error, warn } from '../messages';
import { DBTransaction } from './db-transactions';
import { DbCrud } from './db-crud';
import { BuildInstance } from './entites';


export class TnpDB {

  //#region instance
  private static _instance: TnpDB;
  private static async instance() {
    if (!this._instance) {
      const location = path.join(Project.Tnp.location, `bin/db.json`);
      this._instance = new TnpDB(location)
      await this._instance.init(!fse.existsSync(location))
    }
    return this._instance;
  }
  public static get Instance() {
    return this.instance()
  }

  public static get InstanceSync() {
    if (!this._instance) {
      error(`Please use (await TnpDB.Instance) here`);
    }
    return this._instance;
  }

  private _adapter;
  private db;
  private crud: DbCrud;
  public transaction: DBTransaction;
  //#endregion


  public async init(recreate = true) {
    if (recreate) {
      fse.writeFileSync(this.location, '')
    }
    this._adapter = new FileSync(this.location)
    this.db = low(this._adapter)
    this.crud = new DbCrud(this.db);
    this.transaction = new DBTransaction(this.crud);
    if (recreate) {
      await this.transaction.reinitDB()
    }
  }


  constructor(private location: string) {
  }

  lastCommandFrom(location: string) {
    return this.transaction.__commandsCtrl.lastCommandFrom(location)
  }


  public get checkIf() {
    const self = this;
    return {
      get allowed() {
        return {
          toRunBuild(project: Project, options: BuildOptions) {

          },
          toInstallTnp(project: Project) {
            let allowed = true;
            const p = project.isWorkspaceChildProject ? project.parent : project;
            if (p.isWorkspace) {
              const builds = self.crud.getALL(BuildInstance) as BuildInstance[];
              builds.some(b => {
                if (p.children.filter(c => c.location === b.project.location)) {
                  allowed = false;
                  return true;
                }
                return false;
              })
            }
            return allowed;
          },
          toWatchWorkspace(workspaceChild: Project) {
            let allowed = true;
            const p = workspaceChild.isWorkspaceChildProject ? workspaceChild.parent : workspaceChild;
            if (p.isWorkspace) {
              const builds = self.crud.getALL(BuildInstance) as BuildInstance[];
              builds.find(b => {
                if (p.children.filter(c => c.location === b.project.location)) {
                  allowed = false;
                  return true;
                }
                return false;
              })
            }
            return allowed;
          }

        }
      }
    }
  }
}



//#endregion
