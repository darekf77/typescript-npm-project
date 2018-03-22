import { Repository } from 'typeorm';
import { Connection } from "typeorm/connection/Connection";
import { BASE_ENTITY } from './BASE_ENTITY';


export class META<E, ER> {
  entityClass: { new(any?): E };
  db: ER;
  table: string;

  public static tableNameFrom(entityClass: Function | BASE_ENTITY) {
    entityClass = entityClass as Function;
    return `tb_${entityClass.name.toLowerCase()}`
  };

  public static getMeta<E, ER=Repository<E>>(connection: Connection,
    entityClass: Function,
    entityCustomRepo?: Function, config?: Object) {
    if (config) {
      Object.assign(entityClass.prototype, config);
    }
    return {
      entityClass: entityClass,
      get db() {
        const res = entityCustomRepo ? connection.getCustomRepository(entityCustomRepo) : connection.getRepository(entityClass);
        if (config) {
          Object.assign(res, config)
        }
        return res as ER;
      },
      table: META.tableNameFrom(entityClass)
    } as META<E, ER>;
  }
}
