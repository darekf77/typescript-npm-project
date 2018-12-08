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
  gitRemote: ''
}, {
    progress: PROGRESS_BAR_DATA
  })
@CLASSNAME('BUILD')
export class BUILD implements IBUILD {

  @PrimaryGeneratedColumn()
  id: number;

  path: string;
  get name(): string {
    if (this.customName) {
      return this.customName;
    }
    if (this.isSelf) {
      return 'AUTOBUILD'
    }
    if (this.gitRemote) {
      const nameFromRemote = _.first(this.gitRemote.match(/([a-z-])+\.git/g)).replace('.git', '');
      if (this.gitFolder) {
        return `${nameFromRemote}/${this.gitFolder}`
      }
      return nameFromRemote;
    }
    if (this.path) {
      const maxPathLength = 100;
      if (this.path.length > maxPathLength) {
        return this.path.substr(this.path.length - maxPathLength)
      }
      return this.path;
    }
    console.warn(`entity [BUILD] Cannot resolve project name`)
    return '';
  }
  project: TNP_PROJECT;
  gitRemote: string;
  gitFolder: string;
  customName: string;
  isSelf: boolean = false;
}
