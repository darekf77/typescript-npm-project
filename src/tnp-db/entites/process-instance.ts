//#region @backend
import * as _ from 'lodash';
import { DBBaseEntity } from './base-entity';
import { CLASS } from 'typescript-class-helpers';

/**
 * TODO Useless now ?
 */
export class ProcessInstance extends DBBaseEntity {
  isEqual(anotherInstace: ProcessInstance): boolean {
    return (this.pid === anotherInstace.pid)
  }

  pid: number;
  cmd: string;
  cwd: string;
  name: string;
  meta: string;
  env: any;

}
//#endregion
