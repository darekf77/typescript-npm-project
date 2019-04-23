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
  BaseController,
  ProcessController
} from './controllers';
import { Project } from '../project';
import { BuildOptions } from '../models/build-options';
import { BuildInstance } from './entites/build-instance';
import { warn, error } from '../helpers';
import { killProcess, questionYesNo } from '../helpers';
import { CommandInstance, ProjectInstance, ProcessMetaInfo, ProcessInstance } from './entites';
import { PortsSet } from './controllers/ports-set';
import { PsListInfo } from '../models/ps-info';
import chalk from 'chalk';

export type ProcessBoundAction = (
  process: ProcessInstance
) => Promise<{
  metaInfo: ProcessMetaInfo,
  relation1TO1entityId?: number
}>



export class DBTransaction {


  private controllers: BaseController[] = []

  constructor(
    private crud: DbCrud,
    private readonly __projectsCtrl: ProjectsController,
    private readonly __domainsCtrl: DomainsController,
    private readonly __buildsCtrl: BuildsController,
    private readonly __portsCtrl: PortsController,
    private readonly __commandsCtrl: CommandsController,
    private readonly __processCtrl: ProcessController,
  ) {


    this.controllers = this.controllers.concat([
      this.__projectsCtrl,
      this.__domainsCtrl,
      this.__buildsCtrl,
      this.__portsCtrl,
      this.__commandsCtrl,
      this.__processCtrl
    ])
  }


  public get portsManager() {
    return new Promise<PortsSet>(async (resolve, reject) => {
      await this.start(`Resolve ports manager`, () => {
        resolve(this.__portsCtrl.manager)
      })
    })
  }


  public async setCommand(command: string) {
    // console.log(`Set commadn: ${command}`)
    let location: string = process.cwd();
    if (!fse.existsSync(location)) {
      error(`Cannot set command - location doesn't exists: ${location}`)
      return
    }
    await this.start(`set command: ${command} in location: ${location}`, () => {
      const c = new CommandInstance(command, location);
      if (_.isString(c.command) && !c.command.trim().startsWith('tnp build')) {
        return;
      }
      this.crud.set(c)
    })
  }

  async updateCommandBuildOptions(location: string, buildOptions: BuildOptions) {
    await this.start('update command build options', async () => {
      this.__commandsCtrl.updateCommandBuildOptions(location, buildOptions);
    })
  }

  public async reinitDB() {
    await this.start(`Reinit db`, async () => {
      this.crud.clearDBandReinit({
        projects: [],
        domains: [],
        ports: [],
        builds: [],
        commands: [],
        processes: []
      });
      await this.__projectsCtrl.addExisted()
      await this.__domainsCtrl.addExisted()
      await this.__commandsCtrl.addExisted()
      await this.__portsCtrl.addExisted()
      await this.__buildsCtrl.addExisted()
      await this.__processCtrl.addExisted()
    })
  }


  public addProjectIfNotExist(project: Project) {
    this.__projectsCtrl.addIfNotExists(ProjectInstance.from(project));
  }

  public async killInstancesFrom(projects: Project[]) {
    await this.start(`kill instances from projets`, async () => {
      await this.__buildsCtrl.update()
      await this.__buildsCtrl.killInstancesFrom(projects)
      await this.__buildsCtrl.update()
    });
  }

  private killAndRemove(existed: BuildInstance) {
    try {
      killProcess(existed.pid)
    } catch (error) {
    }
    this.crud.remove(existed)
  }

  async boundActions(
    action1: ProcessBoundAction,
    action2: ProcessBoundAction) {

    await this.start(`bound process`, async () => {
      let d = await action1(void 0);
      let proc = await this.boundProcess(d.metaInfo, d.relation1TO1entityId);
      d = await action2(proc);
      if(d) {
        await this.boundProcess(d.metaInfo, d.relation1TO1entityId);
      }
    });
  }

  private boundProcess(metaInfo: ProcessMetaInfo, relation1TO1entityId?: number): Promise<ProcessInstance> {
    return new Promise<ProcessInstance>(async (resolve) => {
      let proc = this.__processCtrl.boundProcess(metaInfo, relation1TO1entityId)
      resolve(proc);
    });
  }



  public async updateBuildsWithCurrent(currentProject: Project,
    buildOptions: BuildOptions, pid: number, onlyUpdate: boolean) {
    // console.log('current build options', buildOptions)
    await this.start(`update builds with current`, async () => {
      this.__projectsCtrl.addIfNotExists(ProjectInstance.from(currentProject))

      while (true) {
        await this.__buildsCtrl.update()
        if (onlyUpdate) {
          break;
        }

        const existed = this.__buildsCtrl.getExistedForOptions(currentProject, buildOptions, pid);

        if (existed) {

          if (!existed.buildOptions.watch) {
            warn('automatic kill of active build instance in static build mode')
            this.killAndRemove(existed)
            continue;
          } else {
            console.log(`Current process pid: ${process.pid}`)
            const confirm = await questionYesNo(`There is active process on pid ${existed.pid}, do you wanna kill this process ?
           build options: ${existed.buildOptions.toString()}`)
            if (confirm) {
              this.killAndRemove(existed)
              continue;
            } else {
              process.exit(0)
            }
          }
        } else if (!existed) {
          this.__buildsCtrl.add(currentProject, buildOptions, pid);
        }
        break;
      }
    })
  }




  private async start(name: string, callback: () => void,
    previousFileStatus: 'none' | 'empty' | 'written-started' = 'none') {
    name = '-'
    let debug = false;

    debug && console.log(`Transaction started for pid: ${process.pid}, name: ${chalk.bold(name)}`)
    let rewriteFile = true;
    const transactionFilePath = path.join(__dirname, '..', '..', 'tmp-transaction-pid.txt');

    if (fse.existsSync(transactionFilePath)) {
      try {
        var pidString = fse.readFileSync(transactionFilePath, 'utf8').toString();
      } catch (e) { }

      if (previousFileStatus === 'none' && _.isString(pidString) && pidString.trim() === '') {
        debug && console.log(`Waiting shortly if other process is goint to write something to file  - current pid: ${process.pid} `)
        sleep.msleep(500);
        await this.start(name, callback, 'empty')
        return;
      }
      if ((previousFileStatus === 'none' || previousFileStatus === 'empty') &&
        _.isString(pidString) && pidString.startsWith('[') && !pidString.endsWith(']')) {
        debug && console.log(`Waiting for other process to finish wiring pid - current pid: ${process.pid}`)
        sleep.msleep(500);
        await this.start(name, callback, 'written-started')
        return;
      }
      if (_.isString(pidString) && pidString.startsWith('[') && pidString.endsWith(']')) {
        var pidInFile = Number(pidString.replace(/^\[/, '').replace(/\]$/, ''))
      }
      if (!isNaN(pidInFile) && pidInFile > 0) {

        if (process.ppid === pidInFile || process.pid === pidInFile) {
          rewriteFile = false;
        } else {
          let ps: PsListInfo[] = await psList()
          if (ps.filter(p => p.pid == pidInFile).length >= 1) {

            debug && console.log(`Waiting for transaction on pid ${pidInFile} to end - current pid: ${process.pid}`)
            sleep.msleep(500);
            await this.start(name, callback)
            return;
          }
        }
      }
    }
    if (rewriteFile) {
      fse.writeFileSync(transactionFilePath, `[${process.pid}]`);
    }

    await runSyncOrAsync(callback)
    if (rewriteFile) {
      fse.removeSync(transactionFilePath);
    }
    debug && console.log(`Transaction ${!rewriteFile ? `(inside transaction with pid: ${process.ppid})`
      : ''} ended for pid: ${process.pid}, name: ${chalk.bold(name)}`)
  }


}
//#endregion
