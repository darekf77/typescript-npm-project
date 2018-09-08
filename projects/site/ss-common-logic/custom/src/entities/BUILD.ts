import * as _ from 'lodash';
import { META } from "baseline/ss-common-logic/src/helpers";
import { Entity, Column, PrimaryGeneratedColumn, EntityRepository } from "typeorm";
import { FormlyForm, DefaultModelWithMapping, CLASSNAME } from 'morphi';

//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import { run, HelpersLinks, killProcess } from 'tnp-bundle';
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
      serveLog: path.join(ENV.pathes.backup.builds, `serve-${this.nameFromIdAndRemote}.txt`)
    }

  }

  initialize(staticFolder = undefined) {
    console.log('staticFolder', staticFolder)
    console.log('localPath.repository', this.localPath.repository)
    console.log('localPath.buildFolder', this.localPath.buildFolder)
    console.log('localPath.repositoryFolder', this.localPath.repositoryFolder)
    if (staticFolder) {
      HelpersLinks.createLink(this.localPath.repository, staticFolder);
    } else {
      run(`git clone ${this.gitRemote} ${this.nameFromIdAndRemote}`, { cwd: ENV.pathes.repositories })
    }
    HelpersLinks.createLink(this.localPath.buildFolder, this.localPath.repositoryFolder);
  }


  clear(all = false) {
    run(`tnp clear${all ? ':all' : ''}`,
      { cwd: this.localPath.repositoryFolder, output: false }).sync()
  }

  public get start() {
    const self = this;
    return {
      building() {
        return self.startBuilding()
      },
      serving() {
        return self.startServing()
      }
    }
  }


  private startBuilding() {

    let p = run(`tnp build`, { cwd: this.localPath.repositoryFolder, output: false }).async()

    fse.writeFileSync(this.localPath.buildLog, '');

    p.stdout.addListener('data', (chunk) => {
      fse.appendFileSync(this.localPath.buildLog, chunk)
    });

    p.stderr.addListener('data', (chunk) => {
      fse.appendFileSync(this.localPath.buildLog, chunk)
    });

    this.pidBuildProces = p.pid;
    return p;
  }

  private startServing() {
    let p = run(`tnp start`, { cwd: this.localPath.repositoryFolder, output: false }).async()

    fse.writeFileSync(this.localPath.serveLog, '');

    p.stdout.addListener('data', (chunk) => {
      fse.appendFileSync(this.localPath.serveLog, chunk)
    });

    p.stderr.addListener('data', (chunk) => {
      fse.appendFileSync(this.localPath.serveLog, chunk)
    })

    this.pidServeProces = p.pid;
    return p;
  }

  public get stop() {
    const self = this;
    return {
      building() {
        return self.stopBuilding();
      },
      serving() {
        return self.startServing()
      }
    }
  }

  private stopBuilding() {
    try {
      killProcess(this.pidBuildProces);
    } catch (e) {
      console.log(e)
    }

    this.pidBuildProces = undefined;
  }

  private stopServeing() {
    try {
      killProcess(this.pidServeProces);
    } catch (e) {
      console.log(e)
    }
    this.pidServeProces = undefined
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

  async getById(id: number) {
    const build = await this.findOne(id);
    if (!build) {
      throw `Cannot find build with id ${id}`
    }
    return build;
  }

}


export default BUILD;
