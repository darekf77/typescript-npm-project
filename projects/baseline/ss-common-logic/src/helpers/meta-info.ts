import { Repository } from 'typeorm';
import { Connection } from "typeorm/connection/Connection";
import { BaseCRUD } from 'morphi';


// entities
import { USER, IUSER, USER_REPOSITORY } from '../entities/core/USER';
import { SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from '../entities/core/SESSION';
import { EMAIL, EMAIL_REPOSITORY } from '../entities/core/EMAIL';
import { EMAIL_TYPE, EMAIL_TYPE_NAME, EMAIL_TYPE_REPOSITORY } from '../entities/core/EMAIL_TYPE';
// controllers
import { AuthController } from '../controllers/core/AuthController'
import { DialogController } from '../controllers/DialogController'



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
    // abstract get ctrl(): { [controller: string]: META.BASE_CONTROLLER<any> }
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

