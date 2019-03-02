//#region @backend
import * as _ from 'lodash';
import { DBBaseEntity } from './base-entity';
import { CLASS } from 'typescript-class-helpers';

export type ProcessMetaInfo = {
  className: string;
  entityId: string;
  entityProperty: string;
  cmd?: string;
  cwd?: string;
  pid?: number;
}

export class ProcessInstance extends DBBaseEntity {
  isEqual(anotherInstace: ProcessInstance): boolean {
    return (this.pid === anotherInstace.pid)
  }

  pid: number;
  cmd: string;
  cwd: string;
  name: string;
  relation1TO1entityId: number;
  meta: string;
  env: any;

  setInfo(metaInfo: ProcessMetaInfo) {
    const { className, entityId, entityProperty } = metaInfo;
    this.meta = `${className}-${_.kebabCase(entityId)}${
      _.isString(entityProperty) ? ('-' + entityProperty) : '-'
      }`
  }

  get info(): ProcessMetaInfo {
    const [className, entityId, entityProperty] = this.meta.split('-');
    return { className, entityId, entityProperty };
  }

}
//#endregion
