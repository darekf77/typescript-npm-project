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

export enum BuildStatus {
  NONE,
  FAIL,
  SUCCES
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
            !/\.vscode.*/g.test(src) &&
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

  @Column({ default: BuildStatus.NONE }) status: BuildStatus;

  @Column({ nullable: true, default: '/' }) gitFolder: string;


}


export default BUILD;
