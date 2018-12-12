import * as _ from 'lodash';
import {  Morphi } from 'morphi';

import { TNP_PROJECT } from './TNP_PROJECT';



export interface IBUILD {
  name: string;
  gitFolder: string;

}



@Morphi.Entity<BUILD>({
  className: 'BUILD',
  defaultModelValues: {
    gitRemote: ''
  },
  mapping: {
    progress: 'PROGRESS_BAR_DATA'
  }
})
export class BUILD implements IBUILD {

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
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
