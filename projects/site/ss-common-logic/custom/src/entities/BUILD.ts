import * as _ from 'lodash';
import { META } from "baseline/ss-common-logic/src/helpers";
import { Entity, Column, PrimaryGeneratedColumn, EntityRepository } from "typeorm";
import { FormlyForm, DefaultModelWithMapping, CLASSNAME } from 'morphi';

//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as child from 'child_process';
import { run, HelpersLinks, killProcess } from 'tnp-bundle';
import { DOMAIN_ENVIRONMENT } from './DOMAIN';
import { async } from 'baseline/node_modules/@types/q';
//#endregion

export interface IBUILD {
  name: string;
  pidBuildProces: number;
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
      if (fse.existsSync(this.localPath.repository)) {
        fse.removeSync(this.localPath.repository)
      }
      HelpersLinks.createLink(this.localPath.repository, staticFolder);
    } else {
      run(`git clone ${this.gitRemote} ${this.nameFromIdAndRemote}`, { cwd: ENV.pathes.repositories })
    }
    if (fse.existsSync(this.localPath.buildFolder)) {
      fse.removeSync(this.localPath.buildFolder)
    }
    HelpersLinks.createLink(this.localPath.buildFolder, this.localPath.repositoryFolder);
  }


  clear(all = false) {
    run(`tnp clear${all ? ':all' : ''}`,
      { cwd: this.localPath.repositoryFolder, output: false }).sync()
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

  get start() {
    const self = this;
    return {

      async servingById(id: number) {
        const build = await self.getById(id);

        if (build.pidServeProces) {
          throw `Serving already started on port ${build.pidServeProces}`;
        }

        let p = run(`tnp start`, { cwd: this.localPath.repositoryFolder, output: false }).async()

        fse.writeFileSync(build.localPath.serveLog, '');

        self.attachListeners(p, {
          msgAction: (chunk) => {
            fse.appendFileSync(build.localPath.serveLog, chunk)
          },
          errorAction: (chunk) => {
            fse.appendFileSync(build.localPath.serveErrorLog, chunk)
          },
          endAction: async () => {
            this.pidServeProces = null;
            await self.update(id, build)
            console.log('END ACTION SERVING')
          }
        })

        this.pidServeProces = p.pid;
        await self.update(id, build)
      },

      async buildingById(id: number) {
        const build = await self.getById(id);

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
            build.pidBuildProces = null;
            await self.update(id, build)
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
