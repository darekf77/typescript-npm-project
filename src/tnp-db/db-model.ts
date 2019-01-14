//#region @backend
import { DomainInstance } from './domain-instance';
import { PortInstance } from './port-instance';
import { BuildInstance } from './build-instance';
import { Project } from '../project/base-project';
import { BuildOptions, BuildData } from '../models';
import { TnpDB } from './wrapper-db';



export interface ITnpDBModel {

  projects: Project[];
  builds: BuildInstance[];
  ports: PortInstance[];
  domains: DomainInstance[];

}

export class TnpDBModel {


  private static _instace: TnpDBModel;
  public static async Instance(buildData?: BuildData) {
    if (!this._instace) {
      this._instace = new TnpDBModel(await TnpDB.Instance(false, buildData))
    }
    return this._instace;
  }

  constructor(private db: TnpDB) {

  }


  get projects() {
    return this.db.getAll.projects;
  }

  get builds() {
    return this.db.getAll.builds;
  }




  init(currentProject: Project = Project.Current) {
    const self = this;
    return {
      get at() {
        return {
          async BUILD(buildOptions: BuildOptions, pid: number) {
            self.db.add.projectIfNotExist(currentProject);
            self.db.add.buildIfNotExist(currentProject, buildOptions, pid)
          },
          async INIT() {

          },
          async CLEAN() {

          }
        }
      }
    }
  }

  get ports() {
    return {
      get getFree() {
        return {
          one() {
            return Math.round(Math.random() * 10);
          },
          array(size = 10) {
            return []
          }
        }
      }
    }
  }


  get checkIf() {
    return {
      get allowed() {
        return {
          toRunBuild(project: Project, options: BuildOptions) {

          },
          toInstallTnp(project: Project) {

          },
          toWatchWorkspace(workspaceChild: Project) {

          }
        }
      }
    }
  }




}

//#endregion
