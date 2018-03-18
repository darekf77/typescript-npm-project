import { Repository } from 'typeorm';
import { Connection } from "typeorm/connection/Connection";
import { BASE_ENTITY } from './BASE_ENTITY';

/**
 * Return table name for typeorm
 * @param entityClass TypeOrm entity class
 */
export function tableNameFrom(entityClass: Function | BASE_ENTITY) {
  entityClass = entityClass as Function;
  return `tb_${entityClass.name.toLowerCase()}`
};

export interface META_INFO_ENTITY<T> {
  db: Repository<T>;
  table: string;
}

export function getMeta<E, ER=META_INFO_ENTITY<E>>(connection: Connection,
  entityClass: Function,
  entityCustomRepo?: Function, config?: Object) {
  if (config) {
    Object.assign(entityClass.prototype, config);
  }
  return {
    get db() {
      const res = entityCustomRepo ? connection.getCustomRepository(entityCustomRepo) : connection.getRepository(entityClass);
      if (config) {
        Object.assign(res, config)
      }
      return res;
    },
    table: tableNameFrom(entityClass)
  } as ER & META_INFO_ENTITY<E>;
}
