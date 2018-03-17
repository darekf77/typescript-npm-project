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

export function getMeta<E, ER=E>(connection: Connection,
  entityClass: Function,
  entityCustomRepo?: Function) {

  return {
    get db() {
      return entityCustomRepo ? connection.getCustomRepository(entityCustomRepo) : connection.getRepository(entityClass);
    },
    table: tableNameFrom(entityClass)
  } as META_INFO_ENTITY<ER>;
}
