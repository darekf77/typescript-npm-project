//#region @backend
import { EntityRepository, META } from "morphi";
import { BUILD } from "./../entities/BUILD";
import * as fse from 'fs-extra';
import { run, HelpersLinks, killProcess, pullCurrentBranch } from 'tnp-bundle';
import * as child from 'child_process';
import { PROGRESS_BAR_DATA } from "tnp-bundle";

export interface BUILD_ALIASES {
  builds: string;
  build: string;
}

@EntityRepository(BUILD)
export class BUILD_REPOSITORY extends META.BASE_REPOSITORY<BUILD, BUILD_ALIASES> {
  globalAliases: (keyof BUILD_ALIASES)[] = ['build', 'builds']


  async getById(id: number) {
    const build = await this.findOne(id);
    if (!build) {
      throw `Cannot find build with id ${id}`
    }
    return build;
  }

  async clearById(id: number, all = false) {
    const build = await this.getById(id);

    if (!!build.pidClearProces) {
      throw `Clear process already in progress, id ${id}, pid: ${build.pidClearProces}`
    }

    const p = run(`tnp clear${all ? ':all' : ''}`,
      { cwd: build.localPath.repositoryFolder, output: false }).async()
    build.pidClearProces = p.pid;
    p.on('close', async () => {
      build.pidClearProces = null;
      await this.update(id, build)
      console.log('CLERR COMPLETE  all ? ', all)
      // Global.vars.socket.BE.emit('clearbuildend', build);
    })
    await this.update(id, build)
  }

  get start() {
    const self = this;
    return {

      async servingById(id: number) {
        let build = await self.getById(id);

        if (build.pidServeProces) {
          throw `Serving already started on port ${build.pidServeProces}`;
        }

        build.init();

        let p = run(`tnp start`, { cwd: build.localPath.repositoryFolder }).async()

        fse.writeFileSync(build.localPath.serveLog, '');

        self.attachListeners(p, {
          msgAction: (chunk) => {
            fse.appendFileSync(build.localPath.serveLog, chunk)
          },
          errorAction: (chunk) => {
            fse.appendFileSync(build.localPath.serveErrorLog, chunk)
          },
          endAction: async () => {
            build = await self.getById(id);
            build.pidServeProces = null;
            await self.update(id, build)
            console.log('END ACTION SERVING')
          }
        })

        build.pidServeProces = p.pid;
        await self.update(id, build)
      },

      async buildingById(id: number) {
        let build = await self.getById(id);

        if (build.pidBuildProces) {
          throw `Build already started on port ${build.pidBuildProces}`;
        }

        let p = run(`tnp build`, { cwd: build.localPath.repositoryFolder, output: false }).async()

        fse.writeFileSync(build.localPath.buildLog, '');

        self.attachListeners(p, {
          msgAction: (chunk) => {
            PROGRESS_BAR_DATA.resolveFrom(chunk, async (progress) => {
              let b = await self.getById(id);
              b.progress = progress as any;
              await self.update(id, b)
              console.log('progress updated', progress)
              // Global.vars.socket.BE.emit('newprogress', progress);
            })
            fse.appendFileSync(build.localPath.buildLog, chunk)
          },
          errorAction: async (chunk) => {
            fse.appendFileSync(build.localPath.buildErrorLog, chunk)
            let b = await self.getById(id);
            let p = new PROGRESS_BAR_DATA();
            p.info = 'Build error';
            p.status = 'error';
            p.value = b.progress && b.progress.value;
            b.progress = p as any;
            await self.update(id, b)
          },
          endAction: async () => {
            build = await self.getById(id);
            build.pidBuildProces = null;
            await self.update(id, build)
            // Global.vars.socket.BE.emit('endofbuild', build);
            console.log('END ACTION BUILDING')
          }
        })

        build.pidBuildProces = p.pid;
        await self.update(id, build)
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


  public get stop() {
    const self = this;
    return {
      async buildingById(id: number) {
        const build = await self.getById(id);
        if (build.pidBuildProces) {
          try {
            killProcess(build.pidBuildProces);
          } catch (e) {
            console.log(e)
          }

          build.pidBuildProces = undefined;
          await self.update(id, build)
        }
      },

      async serveingById(id: number) {
        const build = await self.getById(id);
        if (build.pidServeProces) {
          try {
            killProcess(build.pidServeProces);
          } catch (e) {
            console.log(e)
          }

          build.pidServeProces = undefined;
          await self.update(id, build)
        }

      }
    }
  }

}

//#endregion
