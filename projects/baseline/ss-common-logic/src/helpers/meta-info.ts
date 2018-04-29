import { Repository } from 'typeorm';
import { Connection } from "typeorm/connection/Connection";
import { BaseCRUD } from 'morphi';

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

    pagination() {
      // TODO
    }

  }

  export abstract class BASE_ENTITY {

    abstract id: number;

  }

  export abstract class BASE_CONTROLLER<T> extends BaseCRUD<T> {

    //#region @backend
    abstract get db(): { [entities: string]: Repository<any> }
    abstract get ctrl(): { [controller: string]: META.BASE_CONTROLLER<any> }

    abstract async initExampleDbData();

    //#endregion

  }

  //#region @backend
  export abstract class BASE_MOCK_DATA {


    constructor(public connection: Connection) { }

    abstract async init();

    abstract get db(): { [entities: string]: Repository<any> }

    abstract get ctrl(): { [controller: string]: META.BASE_CONTROLLER<any> }


  }
  //#endregion


}

