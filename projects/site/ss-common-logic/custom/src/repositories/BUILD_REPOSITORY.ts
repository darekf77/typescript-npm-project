//#region @backend
import { EntityRepository, META, ModelDataConfig, PathParam } from "morphi";
import { BUILD } from "./../entities/BUILD";
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import { run, HelpersLinks, killProcess, pullCurrentBranch, EnvironmentName } from 'tnp-bundle';
import * as child from 'child_process';
import { PROGRESS_BAR_DATA, ProjectFrom } from "tnp-bundle";
import { TNP_PROJECT } from "../entities/TNP_PROJECT";

export interface BUILD_ALIASES {
  builds: string;
  build: string;
}

@EntityRepository(BUILD)
export class BUILD_REPOSITORY extends META.BASE_REPOSITORY<BUILD, BUILD_ALIASES> {
  globalAliases: (keyof BUILD_ALIASES)[] = ['build', 'builds']

  async getById(id: number) {
    const config = new ModelDataConfig({
      joins: ['project', 'project.children']
    });
    const build = await this.findOne({
      where: { id },
      join: config && config.db && config.db.join
    });

    if (!build) {
      throw `Cannot find build with id ${id}`
    }
    return build;
  }

  async changeEnvironmentBy(idOrBuild: number | BUILD, @PathParam('envname') envname: EnvironmentName = 'dev') {
    let build = _.isNumber(idOrBuild) ? await this.getById(idOrBuild) : idOrBuild;
    build.project.run('tnp clear').sync()
    build.project.run(`tnp init --env ${envname}`).sync();
    build.environmentName = envname;
    await this.update(build.id, build)
  }

  async clearById(idOrBuild: number | BUILD, all = false) {
    let build = _.isNumber(idOrBuild) ? await this.getById(idOrBuild) : idOrBuild;

    if (!!build.project.pidClearProces) {
      throw `Clear process already in progress, id ${build.id}, pid: ${build.project.pidClearProces}`
    }

    const p = run(`tnp clear${all ? ':all' : ''}`,
      { cwd: build.localPath.repositoryFolder, output: false }).async()
    build.project.pidClearProces = p.pid;

    p.on('close', async () => {
      build.project.pidClearProces = null;
      await this.update(build.id, build)
      console.log('CLERR COMPLETE  all ? ', all)
      // Global.vars.socket.BE.emit('clearbuildend', build);
    })

    await this.update(build.id, build)
  }

  get start() {
    const self = this;
    return {

      async servingById(id: number) {
        // let build = await self.getById(id);

        // if (build.project.pidServeProces) {
        //   throw `Serving already started on port ${build.project.pidServeProces}`;
        // }

        // build.init();

        // let p = run(`tnp start`, { cwd: build.localPath.repositoryFolder }).async()

        // fse.writeFileSync(build.localPath.serveLog, '');

        // self.attachListeners(p, {
        //   msgAction: (chunk) => {
        //     fse.appendFileSync(build.localPath.serveLog, chunk)
        //   },
        //   errorAction: (chunk) => {
        //     fse.appendFileSync(build.localPath.serveErrorLog, chunk)
        //   },
        //   endAction: async () => {
        //     build = await self.getById(id);
        //     build.project.pidServeProces = null;
        //     await self.update(id, build)
        //     console.log('END ACTION SERVING')
        //   }
        // })

        // build.project.pidServeProces = p.pid;
        // await self.update(id, build)
      },

      async buildingById(id: number) {
        let build = await self.getById(id);

        if (build.project.pidBuildProces) {
          throw `Build already started on port ${build.project.pidBuildProces}`;
        }

        let p = run(`tnp build`, { cwd: build.localPath.repositoryFolder, output: false }).async()

        fse.writeFileSync(build.localPath.buildLog, '');

        self.attachListeners(p, {
          msgAction: (chunk) => {
            PROGRESS_BAR_DATA.resolveFrom(chunk, async (progress) => {
              let b = await self.getById(id);
              b.project.progress = progress as any;
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
            p.value = b.project.progress && b.project.progress.value;
            b.project.progress = p as any;
            await self.update(id, b)
          },
          endAction: async () => {
            build = await self.getById(id);
            build.project.pidBuildProces = null;
            await self.update(id, build)
            // Global.vars.socket.BE.emit('endofbuild', build);
            console.log('END ACTION BUILDING')
          }
        })

        build.project.pidBuildProces = p.pid;
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
        if (build.project.pidBuildProces) {
          try {
            killProcess(build.project.pidBuildProces);
          } catch (e) {
            console.log(e)
          }

          build.project.pidBuildProces = undefined;
          await self.update(id, build)
        }
      },

      async serveingById(id: number) {
        const build = await self.getById(id);
        if (build.project.pidServeProces) {
          try {
            killProcess(build.project.pidServeProces);
          } catch (e) {
            console.log(e)
          }

          build.project.pidServeProces = undefined;
          await self.update(id, build)
        }

      }
    }
  }

}

//#endregion
