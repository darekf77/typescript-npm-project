import { Repository } from 'typeorm';
import { Connection } from "typeorm/connection/Connection";
import { BaseCRUD } from 'morphi';
import { snakeCase, keys } from "lodash";

export namespace META {

  export function tableNameFrom(entityClass: Function | BASE_ENTITY<any>) {
    entityClass = entityClass as Function;
    return `tb_${entityClass.name.toLowerCase()}`
  }

  //#region @backend
  export function repositoryFrom<E, R=Repository<E>>(connection: Connection, entity: Function, repository?: Function): R {

    let repo: Repository<any>;
    if (repository) {
      repo = connection.getCustomRepository(repository);
    } else {
      repo = connection.getRepository(entity) as any;
    }
    repo['alias'] = {};

    const compolexProperties = (repo as META.BASE_REPOSITORY<any, any>).joinProperties.concat(keys(entity.prototype))

    if (Array.isArray(compolexProperties)) {

      repo['alias']['joinOn'] = {}
      compolexProperties.forEach(alias => {
        repo['alias']['joinOn'][alias] = `${snakeCase(entity.name)}.${alias}`; // TODO make it getter with reference
      })

      repo['alias']['prop'] = {}
      compolexProperties.forEach(alias => {
        repo['alias']['prop'][alias] = alias; // TODO make it getter with reference
      })
    }

    return repo as any;
  }
  //#endregion


  // TODO fix it whe typescipt stable
  export abstract class BASE_REPOSITORY<Entity, GlobalAliases> extends Repository<Entity> {
    //#region @backend
    alias: {
      joinOn: { [propertyName in keyof Entity]: string } & GlobalAliases;
      prop: { [propertyName in keyof Entity]: string } & GlobalAliases;
    };


    abstract joinProperties: (keyof GlobalAliases)[];

    pagination() {
      // TODO
    }
    //#endregion

  }

  export abstract class BASE_ENTITY<T, TRAW=T> {

    abstract id: number;

    abstract fromRaw(obj: TRAW): T

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

