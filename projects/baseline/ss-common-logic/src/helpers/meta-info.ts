import { Repository } from 'typeorm';
import { Connection } from "typeorm/connection/Connection";
import { BaseCRUD, CLASSNAME, ENDPOINT } from 'morphi';
import { snakeCase, keys } from "lodash";

import { isBrowser, Log, Level } from 'ng2-logger';
const log = Log.create('META')

export namespace META {

  class Describer {
    private static FRegEx = new RegExp(/(?:this\.)(.+?(?= ))/g);
    static describe(val: Function, parent = false): string[] {
      var result = [];
      if (parent) {
        var proto = Object.getPrototypeOf(val.prototype);
        if (proto) {
          result = result.concat(this.describe(proto.constructor, parent));
        }
      }
      result = result.concat(val.toString().match(this.FRegEx) || []);
      return result.map(prop => prop.replace('this.', ''))
    }
  }

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
        Describer.describe(entity).concat(compolexProperties as any).forEach(prop => {
          repo['__'][alias][prop] = `${alias as any}.${prop}`; // TODO make it getter with reference
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

