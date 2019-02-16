//#region @backend
import * as _ from 'lodash';
import { DBBaseEntity } from './base-entity';
import { CLASS } from 'typescript-class-helpers';

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

  get entityData(): { Class: Function; id: number; } {
    let s = this.meta.split('_');
    if (s.length !== 2) {
      return {} as any;
    }
    const [id, className] = s;
    const res = {
      Class: CLASS.getBy(className),
      id: Number(id)
    }
    if (!_.isFunction(res.Class)) {
      return {} as any;
    }
    if (!_.isNumber(res.id)) {
      return {} as any;
    }
  }

}
//#endregion
