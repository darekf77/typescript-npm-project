import { Repository } from 'typeorm';
import { Connection } from "typeorm/connection/Connection";
import { BaseCRUD, CLASSNAME, ENDPOINT, Describer } from 'morphi';
import { snakeCase, keys } from "lodash";

import { isBrowser, Log, Level } from 'ng2-logger';
const log = Log.create('META', Level.__NOTHING)

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
    repo['_'] = {};
    repo['__'] = {};

    const compolexProperties = (repo as META.BASE_REPOSITORY<any, any>).globalAliases;

    if (Array.isArray(compolexProperties)) {

      compolexProperties.forEach(alias => {
        repo['__'][alias] = {};

        const describedProps = Describer.describe(entity)
        // console.log(`describedProps  "${describedProps}" for ${entity.name}`)

        describedProps.concat(compolexProperties as any).forEach(prop => {
          repo['__'][alias][prop] = `${alias as any}.${prop}`; // TODO temp solution
        })

        const props = Describer.describeByDefaultModel(entity)
        // console.log(`props  "${props}" for ${entity.name}`)
        props.forEach(prop => {
          repo['__'][alias][prop] = `${alias as any}.${prop}`; // TODO ideal solution
        })

      })

      compolexProperties.forEach(alias => {
        repo['_'][alias] = alias; // TODO make it getter with reference
      })
    }

    return repo as any;
  }
  //#endregion


  // TODO fix it whe typescipt stable
  export abstract class BASE_REPOSITORY<Entity, GlobalAliases> extends Repository<Entity> {
    //#region @backend
    __: { [prop in keyof GlobalAliases]: { [propertyName in keyof Entity]: string } };
    _: GlobalAliases;

    abstract globalAliases: (keyof GlobalAliases)[];

    pagination() {
      // TODO
    }
    //#endregion

  }

  export abstract class BASE_ENTITY<T, TRAW=T> {

    abstract id: number;

    abstract fromRaw(obj: TRAW): T

  }

  @ENDPOINT()
  @CLASSNAME('BASE_ENTITY_CRUD')
  export abstract class BASE_ENTITY_CRUD<T, TRAW=T> extends BaseCRUD<T> {

    abstract id: number;

    abstract fromRaw(obj: TRAW): T;

    //#region @backend
    abstract get db(): { [entities: string]: Repository<any> }
    abstract get ctrl(): { [controller: string]: META.BASE_CONTROLLER<any> }

    abstract async initExampleDbData();

    //#endregion

  }

  @ENDPOINT()
  @CLASSNAME('BASE_CONTROLLER')
  export abstract class BASE_CONTROLLER<T> extends BaseCRUD<T> {

    constructor() {
      super();
      if (isBrowser) {
        log.i('BASE_CONTROLLER, constructor', this)
      }
    }


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

