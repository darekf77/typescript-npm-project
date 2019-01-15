//#region @backend
import { DomainInstance } from './domain-instance';
import { PortInstance } from './port-instance';
import { BuildInstance } from './build-instance';
import * as _ from 'lodash';
import { Project } from '../project/base-project';
import { BuildOptions, BuildData } from '../models';
import { TnpDB } from './wrapper-db';
import { SystemService } from './system-service';


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
    const self = this;
    return {
      get reserve() {
        return {
          forPorject(project: Project) {
            return self.db.portsSet.reserveFreePortsFor(project)
          },
          forSystemServices(reserveFor: SystemService, size = 1) {
            return self.db.portsSet.reserveFreePortsFor(reserveFor as SystemService, size)
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
