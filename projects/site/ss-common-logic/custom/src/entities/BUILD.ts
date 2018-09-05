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
      buildLog: path.join(ENV.pathes.backup.builds, `${this.nameFromIdAndRemote}.txt`),
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

  start() {

    let p = run(`tnp build`, { cwd: this.localPath.repositoryFolder }).async()
    p.stdout.addListener('data', (chunk) => {
      console.log(chunk)
      if (!fse.existsSync(this.localPath.buildLog)) {
        fse.createFileSync(this.localPath.buildLog);
      }
      fse.appendFileSync(this.localPath.buildLog, chunk, {
        encoding: 'utf8'
      })
    });
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
  @Column({ nullable: true, default: '/' }) gitFolder: string;


}

export default BUILD;
