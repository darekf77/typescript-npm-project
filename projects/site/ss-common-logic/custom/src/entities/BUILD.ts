import * as _ from 'lodash';
import { META } from "baseline/ss-common-logic/src/helpers";
import { Entity, Column, PrimaryGeneratedColumn, EntityRepository } from "typeorm";
import { FormlyForm, DefaultModelWithMapping, CLASSNAME, Global } from 'morphi';

//#region @backend
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as child from 'child_process';
import { run, HelpersLinks, killProcess } from 'tnp-bundle';
import { DOMAIN_ENVIRONMENT } from './DOMAIN';
//#endregion

export interface IBUILD {
  name: string;
  pidBuildProces: number;
  pidClearProces: number;
  pidServeProces: number;
}


//#region @backend
@Entity(META.tableNameFrom(BUILD))
//#endregion
@FormlyForm<BUILD>()
@DefaultModelWithMapping<BUILD>({
  gitFolder: '/',
  gitRemote: ''
})
@CLASSNAME('BUILD')
export class BUILD extends META.BASE_ENTITY<BUILD> {


  //#region @backend
  get nameFromIdAndRemote() {
    return `${this.id}-${this.nameFromRemote}`;
  }

  get localPath() {

    return {
      repository: path.join(ENV.pathes.backup.repositories, this.nameFromIdAndRemote),
      repositoryFolder: path.join(ENV.pathes.backup.repositories, this.nameFromIdAndRemote, this.gitFolder),
      buildFolder: path.join(ENV.pathes.backup.builds, this.nameFromIdAndRemote),
      buildLog: path.join(ENV.pathes.backup.builds, `build-${this.nameFromIdAndRemote}.txt`),
      buildErrorLog: path.join(ENV.pathes.backup.builds, `build-error-${this.nameFromIdAndRemote}.txt`),
      serveLog: path.join(ENV.pathes.backup.builds, `serve-${this.nameFromIdAndRemote}.txt`),
      serveErrorLog: path.join(ENV.pathes.backup.builds, `serve-error-${this.nameFromIdAndRemote}.txt`)
    }

  }
  initialize(staticFolder = undefined) {
    // console.log('staticFolder', staticFolder)
    // console.log('localPath.repository', this.localPath.repository)
    // console.log('localPath.buildFolder', this.localPath.buildFolder)
    // console.log('localPath.repositoryFolder', this.localPath.repositoryFolder)
    if (staticFolder) {
      const toCopy = path.join(staticFolder, this.gitFolder);
      const dest = path.join(this.localPath.repository, this.gitFolder)

      const options: fse.CopyOptionsSync = {
        overwrite: true,
        recursive: true,
        errorOnExist: true,
        filter: (src) => {
          return !/.*node_modules.*/g.test(src) &&
            !/.*tmp.*/g.test(src) &&
            !/.*dist.*/g.test(src);
        }
      };

      if (!fse.existsSync(dest)) {
        fse.copySync(toCopy, dest, options);
      }

      // HelpersLinks.createLink(this.localPath.repository, staticFolder);
    } else {
      run(`git clone ${this.gitRemote} ${this.nameFromIdAndRemote}`, { cwd: ENV.pathes.repositories })
    }
    if (fse.existsSync(this.localPath.buildFolder)) {
      fse.removeSync(this.localPath.buildFolder)
    }
    HelpersLinks.createLink(this.localPath.buildFolder, this.localPath.repositoryFolder);
  }

  //#endregion



  @PrimaryGeneratedColumn()
  id: number;

  fromRaw(obj: BUILD): BUILD {
    throw new Error("Method not implemented.");
  }

  get name() {
    return (this.gitFolder !== '/') ? _.startCase(this.gitFolder) : _.startCase(this.nameFromRemote);
  }


  get nameFromRemote() {
    return _.first(this.gitRemote.match(/([a-z-])+\.git/g)).replace('.git', '');
  }


  @Column({ nullable: true }) port: string;
  @Column() gitRemote: string;

  @Column({ nullable: true }) pidBuildProces: number;
  @Column({ nullable: true }) pidClearProces: number;
  @Column({ nullable: true }) pidServeProces: number;

  @Column({ nullable: true, default: '/' }) gitFolder: string;


}

export interface BUILD_ALIASES {
  builds: string;
  build: string;
}

@EntityRepository(BUILD)
export class BUILD_REPOSITORY extends META.BASE_REPOSITORY<BUILD, BUILD_ALIASES> {
  globalAliases: (keyof BUILD_ALIASES)[] = ['build', 'builds']

  //#region @backend
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

        let p = run(`tnp start`, { cwd: build.localPath.repositoryFolder, output: false }).async()

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

        this.pidServeProces = p.pid;
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
            fse.appendFileSync(build.localPath.buildLog, chunk)
          },
          errorAction: (chunk) => {
            fse.appendFileSync(build.localPath.buildErrorLog, chunk)
          },
          endAction: async () => {
            build = await self.getById(id);
            build.pidBuildProces = null;
            await self.update(id, build)
            Global.vars.socket.BE.emit('endofbuild', build);
            console.log('END ACTION BUILDING')
          }
        })

        build.pidBuildProces = p.pid;
        await self.update(id, build)
      }

    }
  }


  private attachListeners(p: child.ChildProcess, actions: {
    msgAction: (message: string) => void;
    endAction: (exitCode: number) => void;
    errorAction: (message: string) => void
  }) {

    const { msgAction, endAction, errorAction } = actions;

    p.stdout.on('data', (m) => {
      msgAction(m.toString());
    })

    p.stdout.on('error', (m) => {
      errorAction(JSON.stringify(m))
    })

    p.stdout.on('close', (m) => {
      p.stdout.removeAllListeners();
      endAction(m)
    });

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
  //#endregion
}


export default BUILD;
