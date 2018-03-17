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
  api: T;
  repo: Repository<T>;
  table: string;
}

export function $__<entityClass>(connection: Connection, entityClass: BASE_ENTITY) {
  return {
    api: entityClass as any,
    repo: connection.getRepository(entityClass as any),
    table: tableNameFrom(entityClass)
  } as META_INFO_ENTITY<entityClass>;
}
