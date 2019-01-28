//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as  psList from 'ps-list';
import * as sleep from 'sleep';

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
import { warn, error } from '../messages';
import { killProcess, questionYesNo } from '../process';
import { CommandInstance, ProjectInstance } from './entites';
import { PortsSet } from './controllers/ports-set';
import { PsListInfo } from '../models/ps-info';



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
    this.__commandsCtrl = new CommandsController(crud)

    this.controllers = this.controllers.concat([
      this.__projectsCtrl,
      this.__domainsCtrl,
      this.__buildsCtrl,
      this.__portsCtrl,
      this.__commandsCtrl
    ])
  }


  public get portsManager() {
    return new Promise<PortsSet>(async (resolve, reject) => {
      await this.start(() => {
        resolve(this.__portsCtrl.manager)
      })
    })
  }


  public async setCommand(command: string) {
    let location: string = process.cwd();
    if (!fse.existsSync(location)) {
      error(`Cannot set command - location doesn't exists: ${location}`)
      return
    }
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

  async updateCommandBuildOptions(location: string, buildOptions: BuildOptions) {
    await this.start(async () => {
      this.__commandsCtrl.updateCommandBuildOptions(location, buildOptions);
    })
  }

  public async reinitDB() {
    await this.start(async () => {
      this.crud.clearDBandReinit({ projects: [], domains: [], ports: [], builds: [], commands: [] })
      await this.__projectsCtrl.addExisted()
      await this.__domainsCtrl.addExisted()
      await this.__commandsCtrl.addExisted()
      await this.__portsCtrl.addExisted()
      await this.__buildsCtrl.addExisted()
    })
  }

  public addProjectIfNotExist(project: Project) {
    this.__projectsCtrl.addIfNotExists(ProjectInstance.from(project));
  }

  public async build(currentProject: Project, buildOptions: BuildOptions, pid: number) {
    // console.log('current build options', buildOptions)
    this.start(async () => {
      this.__projectsCtrl.addIfNotExists(ProjectInstance.from(currentProject))
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




  private async start(callback: () => void,
    previousFileStatus: 'none' | 'empty' | 'written-started' = 'none') {

    console.log('Transaction started')

    const transactionFilePath = path.join(__dirname, '..', '..', 'tmp-transaction-pid.txt');

    if (fse.existsSync(transactionFilePath)) {
      try {
        var pidString = fse.readFileSync(transactionFilePath, 'utf8').toString();
      } catch (e) { }

      if (previousFileStatus === 'none' && _.isString(pidString) && pidString.trim() === '') {
        console.log(`Waiting shortly if other process is goint to write something to file`)
        sleep.msleep(500);
        await this.start(callback, 'empty')
        return;
      }
      if ((previousFileStatus === 'none' || previousFileStatus === 'empty') &&
        _.isString(pidString) && pidString.startsWith('[') && !pidString.endsWith(']')) {
        console.log(`Waiting for other process to finish wiring pid`)
        sleep.msleep(500);
        await this.start(callback, 'written-started')
        return;
      }
      if (_.isString(pidString) && pidString.startsWith('[') && pidString.endsWith(']')) {
        var pidInFile = Number(pidString.replace(/^\[/, '').replace(/\]$/, ''))
      }
      if (!isNaN(pidInFile) && pidInFile > 0) {

        if (process.ppid === pidInFile) {
          warn(`Child process will override transaction`)
        }
        let ps: PsListInfo[] = await psList()
        if (ps.filter(p => p.pid == pidInFile).length >= 1) {

          console.log(`Waiting for transaction on pid ${pidInFile} to end`)
          sleep.msleep(500);
          await this.start(callback)
          return;
        }
      }
    }
    fse.writeFileSync(transactionFilePath, `[${process.pid}]`);
    await runSyncOrAsync(callback)
    fse.removeSync(transactionFilePath);
    console.log('Transaction ended')
  }


}
//#endregion
