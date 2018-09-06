import * as _ from 'lodash';
import { META } from "baseline/ss-common-logic/src/helpers";
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { FormlyForm, DefaultModelWithMapping, CLASSNAME } from 'morphi';

//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import { run, HelpersLinks } from 'tnp-bundle';
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
    if (staticFolder) {
      HelpersLinks.createLink(this.localPath.repository, staticFolder);
    } else {
      run(`git clone ${this.gitRemote} ${this.nameFromIdAndRemote}`, { cwd: ENV.pathes.repositories })
    }
    HelpersLinks.createLink(this.localPath.buildFolder, this.localPath.repositoryFolder);
  }



  startBuilding() {

    let p = run(`tnp build`, { cwd: this.localPath.repositoryFolder, output: false }).async()

    fse.writeFileSync(this.localPath.buildLog, '');

    p.stdout.addListener('data', (chunk) => {
      fse.appendFileSync(this.localPath.buildLog, chunk)
    });

    this.pidBuildProces = p.pid;
    return p;
  }

  startServing() {
    let p = run(`tnp start`, { cwd: this.localPath.repositoryFolder, output: false }).async()

    fse.writeFileSync(this.localPath.serveLog, '');

    p.stdout.addListener('data', (chunk) => {
      fse.appendFileSync(this.localPath.serveLog, chunk)
    });

    this.pidServeProces = p.pid;
    return p;
  }


  stopBuilding() {
    try {
      run(`kill -9 ${this.pidBuildProces}`).sync()
    } catch (e) {
      console.log(e)
    }

    this.pidBuildProces = undefined;
  }

  stopServeing() {
    try {
      run(`kill -9 ${this.pidServeProces}`).sync()
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

export default BUILD;
