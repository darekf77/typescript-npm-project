//#region @backend
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as child from 'child_process';
import axios from 'axios';


// local
import { PROGRESS_BAR_DATA, ProjectFrom, Project } from "tnp-bundle";
import { run, HelpersLinks, killProcess, pullCurrentBranch, EnvironmentName } from 'tnp-bundle';
import { EntityRepository, META } from "morphi";
import { TNP_PROJECT, SelfUpdate } from "../entities/TNP_PROJECT";

export interface TNP_PROJECT_ALIASES {
  project: string;
  projects: string;
}

@EntityRepository(TNP_PROJECT)
export class TNP_PROJECT_REPOSITORY extends META.BASE_REPOSITORY<TNP_PROJECT, TNP_PROJECT_ALIASES> {
  globalAliases: (keyof TNP_PROJECT_ALIASES)[] = ['project', 'projects']

  async getById(id: number) {
    const project = await this.findOne(id);

    if (!project) {
      throw `Cannot find project with id ${id}`
    }
    return project;
  }


  get start() {
    const self = this;
    return {

      async servingById(id: number) {
        let project = await self.getById(id);

        if (project.pidServeProces) {
          throw `Serving already started on port ${project.pidServeProces}`;
        }

        let p = run(`tnp start`, { cwd: project.location }).async()

        fse.writeFileSync(project.servelogFilePath, '');

        self.attachListeners(p, {
          msgAction: (chunk) => {
            fse.appendFileSync(project.servelogFilePath, chunk)
          },
          errorAction: (chunk) => {
            fse.appendFileSync(project.serverErrorslogFilePath, chunk)
          },
          endAction: async () => {
            project = await self.getById(id);
            project.pidServeProces = null;
            await self.updateRealtime(id, project)
            console.log('END ACTION SERVING')
          }
        })

        project.pidServeProces = p.pid;
        await self.updateRealtime(id, project)
      },

      async buildingById(id: number) {
        let project = await self.getById(id);

        if (project.pidBuildProces) {
          throw `Build already started on port ${project.pidBuildProces}`;
        }

        let p = run(`tnp build`, {
          cwd: project.location, output: false,
          biggerBuffer: true
        }).async()

        fse.writeFileSync(project.buildlogFilePath, '');

        self.attachListeners(p, {
          msgAction: (chunk) => {
            // console.log('chunk', chunk)
            PROGRESS_BAR_DATA.resolveFrom(chunk, async (progress) => {
              project = await self.getById(id);
              project.progress = progress as any;
              await self.updateRealtime(id, project)
              // console.log('realtime update project progress to ', progress)
            })
            fse.appendFileSync(project.buildlogFilePath, chunk)
          },
          errorAction: async (chunk) => {
            console.log('error chunk', chunk)
            fse.appendFileSync(project.buildErrorslogFilePath, chunk)
            project = await self.getById(id);
            let p = new PROGRESS_BAR_DATA();
            p.info = 'Build error';
            p.status = 'error';
            p.value = project.progress && project.progress.value;
            project.progress = p as any;
            await self.updateRealtime(id, project)
          },
          endAction: async () => {
            console.log('end actiob build by id', id)
            project = await self.getById(id);
            project.pidBuildProces = null;
            await self.updateRealtime(id, project)
          }
        })

        project.pidBuildProces = p.pid;
        await self.updateRealtime(id, project)
        console.log('build pid should be update relatime ')
      }

    }
  }


  private attachListeners(childProcess: child.ChildProcess, actions: {
    msgAction: (message: string) => void;
    endAction: (exitCode: number) => void;
    errorAction: (message: string) => void
  }) {

    const { msgAction, endAction, errorAction } = actions;

    childProcess.stdout.on('data', (m) => {
      msgAction(m.toString());
    })

    childProcess.stdout.on('error', (m) => {
      errorAction(JSON.stringify(m))
    })

    childProcess.stderr.on('data', (m) => {
      msgAction(m.toString());
    })

    childProcess.stderr.on('error', (m) => {
      errorAction(JSON.stringify(m))
    })

    childProcess.on('exit', (exit, signal) => {
      endAction(exit);
      childProcess.removeAllListeners();
    })

  }

  public get selfupdate() {
    const self = this;
    return {
      async begin(child?: string) {
        if (child) {
          run(`tnp cloud:update --child=${child}`).sync();
        } else {
          run('tnp cloud:update').sync();
        }
        console.log('Selft update begin...')
      },
      async status(waitForAnswer = false, maxWait = 120) {
        let address = `http://localhost:${ENV.cloud.ports.update}/status`;
        console.log(`Ping to this server for selfupdate status ${address}`)
        return new Promise((resolve, reject) => {
          let countSec = 0;

          async function getStatus() {
            if (countSec === maxWait) {
              reject(`Selft update wait max exceeded`)
            } else {
              try {
                let res = await axios.get(address)
                const data = res.data as SelfUpdate;
                data.progress = _.merge(new PROGRESS_BAR_DATA(), data.progress);
                resolve(data)
              } catch (error) {
                if (!waitForAnswer) {
                  reject(error)
                } else {
                  console.log(`Trying to wait (${++countSec}) for slef update status on address: ${address}`);
                  setTimeout(async () => {
                    await getStatus();
                  }, 1000)
                }
              }
            }

          }
          getStatus()
        })

      },
    }
  }


  public get stop() {
    const self = this;
    return {
      async buildingById(id: number) {
        let project = await self.getById(id);

        if (project.pidBuildProces) {
          try {
            killProcess(project.pidBuildProces);
          } catch (e) {
            console.log(e)
          }

          project.pidBuildProces = undefined;
          await self.updateRealtime(id, project)
        }
      },

      async serveingById(id: number) {
        let project = await self.getById(id);

        if (project.pidServeProces) {
          try {
            killProcess(project.pidServeProces);
          } catch (e) {
            console.log(e)
          }

          project.pidServeProces = undefined;
          await self.updateRealtime(id, project)
        }

      }
    }
  }



  async clearById(idOrProject: number | TNP_PROJECT, all = false) {
    let project = _.isNumber(idOrProject) ? await this.getById(idOrProject) : idOrProject;

    if (!!project.pidClearProces) {
      throw `Clear process already in progress, id ${project.id}, pid: ${project.pidClearProces}`
    }

    const p = run(`tnp clear${all ? ':all' : ''}`,
      { cwd: project.location, output: false }).async()
    project.pidClearProces = p.pid;

    p.on('close', async () => {
      project = await this.getById(project.id);
      project.pidClearProces = null;
      await this.updateRealtime(project.id, project)
    })


    await this.updateRealtime(project.id, project)
    // console.log('clear pid should populate realitime ', project)
  }

}


//#endregion
