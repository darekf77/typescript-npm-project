import * as _ from 'lodash';
import { Entity, Column, PrimaryGeneratedColumn, EntityRepository, OneToOne, JoinColumn } from "typeorm";
import { FormlyForm, DefaultModelWithMapping, CLASSNAME, Global, META } from 'morphi';
import { config } from 'tnp-bundle';

//#region @backend
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as child from 'child_process';
import { run, HelpersLinks, killProcess, pullCurrentBranch } from 'tnp-bundle';

//#endregion
import {
  PROGRESS_BAR_DATA
} from 'baseline/ss-common-logic/src/entities/PROGRESS_BAR_DATA';
import { TNP_PROJECT } from './TNP_PROJECT';



export interface IBUILD {
  name: string;
  gitFolder: string;

}

//#region @backend
@Entity(META.tableNameFrom(BUILD))
//#endregion
@FormlyForm<BUILD>()
@DefaultModelWithMapping<BUILD>({
  gitFolder: '/',
  gitRemote: '',
  friendlyName: 'fiiendly name',
}, {
    progress: PROGRESS_BAR_DATA
  })
@CLASSNAME('BUILD')
export class BUILD extends META.BASE_ENTITY<BUILD> {


  //#region @backend
  get nameFromIdAndRemote() {
    return `${this.id}-${this.nameFromRemote}`;
  }

  get localPath() {

    return {
      repositoryFolder: path.join(ENV.pathes.backup.repositories, this.nameFromIdAndRemote, this.gitFolder),
      buildFolder: path.join(ENV.pathes.backup.builds, this.nameFromIdAndRemote)
    }

  }

  init(selfBuild = false) {
    if (_.isString(this.staticFolder) && this.staticFolder !== '') {
      this.reinitFrom.folder(selfBuild)
    } else {
      this.reinitFrom.repository()
    }
    const location = this.localPath.buildFolder;

    const project = TNP_PROJECT.from(location);
    this.project = project;
  }


  private get reinitFrom() {
    const self = this;
    return {
      folder(selfBuild = false) {

        if (ENV.name !== 'local') {
          pullCurrentBranch(self.staticFolder);
        }

        const toCopy = path.join(self.staticFolder, self.gitFolder);
        const dest = self.localPath.repositoryFolder;

        if (selfBuild) {

          const slefRepoLink = path.join(ENV.pathes.backup.repositories, self.nameFromIdAndRemote);
          if (fse.existsSync(slefRepoLink)) {
            fse.removeSync(slefRepoLink)
          }

          HelpersLinks.createLink(slefRepoLink, self.staticFolder);

        } else {
          const options: fse.CopyOptionsSync = {
            overwrite: true,
            recursive: true,
            filter: (src) => {
              return !/.*node_modules.*/g.test(src) &&
                !/.*tmp.*/g.test(src) &&
                !/\.vscode.*/g.test(src) &&
                !/.*dist.*/g.test(src) &&
                !fs.lstatSync(src).isSymbolicLink();
            }
          };

          fse.copySync(toCopy, dest, options);
          run(`tnp claer`, { cwd: dest });


        }
        self.linkRepoToBuild()


      },

      repository() {
        const p = path.join(ENV.pathes.repositories, self.nameFromIdAndRemote);
        if (fse.existsSync(p)) {
          pullCurrentBranch(this.localPath.repositoryFolder);
        } else {
          run(`git clone ${self.gitRemote} ${self.nameFromIdAndRemote}`, { cwd: ENV.pathes.repositories })
        }
        self.linkRepoToBuild()
      }


    }


  }

  private linkRepoToBuild() {
    if (fse.existsSync(this.localPath.buildFolder)) {
      fse.removeSync(this.localPath.buildFolder)
    }

    HelpersLinks.createLink(this.localPath.buildFolder, this.localPath.repositoryFolder);
  }


  //#endregion



  @PrimaryGeneratedColumn()
  id: number;

  fromRaw(obj: BUILD): BUILD {
    return _.merge(new BUILD(), obj);
  }


  get name() {
    return this.isSelf ? 'AUTOBUILD' : ((this.gitFolder !== '/') ? _.startCase(this.gitFolder) : _.startCase(this.nameFromRemote));
  }


  get nameFromRemote() {
    return _.first(this.gitRemote.match(/([a-z-])+\.git/g)).replace('.git', '');
  }

  @OneToOne(type => TNP_PROJECT)
  @JoinColumn()
  project: TNP_PROJECT;

  @Column() gitRemote: string;


  @Column({ nullable: true }) staticFolder: string;
  

  @Column({ nullable: true, default: '/' }) gitFolder: string;

  @Column({ nullable: true, default: 'friendlyName' }) friendlyName: string;

  @Column({
    type: 'boolean',
    default: false
  }) isSelf: boolean = false;



}


export default BUILD;
