import { Repository } from 'typeorm';
import { Connection } from "typeorm/connection/Connection";
import { BaseCRUD } from 'morphi';
import { entities } from '../entities';


export namespace META {

  export function tableNameFrom(entityClass: Function | BASE_ENTITY) {
    entityClass = entityClass as Function;
    return `tb_${entityClass.name.toLowerCase()}`
  }

  export function repositoryFrom<E, R=Repository<E>>(connection: Connection, entity: Function, repository?: Function): R {
    if (repository) {
      return connection.getCustomRepository(repository);
    }
    return connection.getRepository(entity) as any;
  }


  export abstract class BASE_REPOSITORY<E> extends Repository<E> {

  }

  export abstract class BASE_ENTITY {

    abstract id: number;

  }

  export abstract class BASE_CONTROLLER<T> extends BaseCRUD<T> {

    //#region @backend
    get db() {
      return entities(this.connection);
    }
    //#endregion

  }

  export abstract class BASE_MOCK_DATA {

    constructor(public connection: Connection) {

    }

  }



}

