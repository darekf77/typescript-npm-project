import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';

import { runSyncOrAsync } from '../helpers';

import { DbCrud } from './db-crud';
import {
  ProjectsController,
  DomainsController,
  BuildsController,
  PortsController,
  CommandsController,
  BaseController
} from './controllers';
import { Project } from '../project';
import { BuildOptions } from '../models/build-options';
import { BuildInstance } from './entites/build-instance';
import { warn } from '../messages';
import { killProcess, questionYesNo } from '../process';
import { CommandInstance } from './entites';



export class DBTransaction {

  public readonly __projectsCtrl: ProjectsController;
  public readonly __domainsCtrl: DomainsController;
  public readonly __buildsCtrl: BuildsController;
  public readonly __portsCtrl: PortsController;
  public readonly __commandsCtrl: CommandsController;
  private controllers: BaseController[] = []

  constructor(private crud: DbCrud) {
    this.__projectsCtrl = new ProjectsController(crud);
    this.__domainsCtrl = new DomainsController(crud);
    this.__buildsCtrl = new BuildsController(crud);
    this.__portsCtrl = new PortsController(crud);

    this.controllers = this.controllers.concat([
      this.__projectsCtrl,
      this.__domainsCtrl,
      this.__buildsCtrl,
      this.__portsCtrl
    ])
  }

  public async setCommand(command: string, location: string) {
    await this.start(() => {
      const c = new CommandInstance(command, location);
      this.crud.set(c)
    })
  }

  public async runCommand(cmd: CommandInstance) {
    await this.start(async () => {
      await this.__commandsCtrl.runCommand(cmd)
    })
  }

  updateCommandBuildOptions(location: string, buildOptions: BuildOptions) {
    this.__commandsCtrl.updateCommandBuildOptions(location, buildOptions);
  }

  public async reinitDB() {
    await this.start(async () => {
      this.crud.clearDBandReinit()
      for (let index = 0; index < this.controllers.length; index++) {
        const ctrl = this.controllers[index];
        await ctrl.addExisted()
      }
    })
  }

  public addProjectIfNotExist(project: Project) {
    this.__projectsCtrl.addIfNotExists(project);
  }

  public async build(currentProject: Project, buildOptions: BuildOptions, pid: number) {
    // console.log('current build options', buildOptions)
    this.start(async () => {
      this.__projectsCtrl.addIfNotExists(currentProject)
      while (true) {

        const existed = this.__buildsCtrl.getExistedForOptions(currentProject, buildOptions, pid);

        if (existed && existed.pid !== process.pid) {

          const kill = () => {
            try {
              killProcess(existed.pid)
            } catch (error) {
            }

            this.crud.remove(existed)
          }

          if (!existed.buildOptions.watch) {
            warn('automatic kill of active build instance in static build mode')
            kill()
            continue;
          } else {
            console.log(`Current process pid: ${process.pid}`)
            const confirm = await questionYesNo(`There is active process on pid ${existed.pid}, do you wanna kill this process ?
           build options: ${existed.buildOptions.toString()}`)
            if (confirm) {
              kill();
              continue;
            } else {
              process.exit(0)
            }
          }
        } else {
          this.__buildsCtrl.add(currentProject, buildOptions, pid);
        }
        break;
      }
    })
  }




  private async start(callback: () => void) {
    console.log('Transaction started')
    await runSyncOrAsync(callback)
    console.log('Transaction ended')
  }





}
