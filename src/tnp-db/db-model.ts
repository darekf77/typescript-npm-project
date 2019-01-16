//#region @backend
import { DomainInstance } from './domain-instance';
import { PortInstance } from './port-instance';
import { BuildInstance } from './build-instance';
import * as _ from 'lodash';
import { Project } from '../project/base-project';
import { BuildOptions, BuildData } from '../models';
import { TnpDB } from './wrapper-db';
import { SystemService } from './system-service';
import { CommandInstance } from './command-instance';


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

  get get() {
    const self = this;
    return {
      lastCommandFrom(location: string): CommandInstance {
        return self.db.commandsSet.lastCommandFrom(location);
      }
    }
  }

  get update() {
    const self = this;
    return {
      command(cmd: CommandInstance) {
        self.db.commandsSet.update(cmd);
      }
    }
  }

  get start() {
    const self = this;
    return {
      async lastCommand(cmd: CommandInstance) {
        await self.db.commandsSet.runCommand(cmd);
      }
    }
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

          },
          async ANY_COMMAND(location: string, args: string[]) {
            self.db.commandsSet.setCommand(location, args.join(' '))
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
    const self = this;
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
