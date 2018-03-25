import { Repository } from 'typeorm';
import { Connection } from "typeorm/connection/Connection";


export namespace META {

  export interface ControllerClassMeta<E> {
    controllerClass: { new(any?): E };
  }

  export function fromController<E>(controllerClass: Function) {
    return {
      controllerClass
    } as ControllerClassMeta<E>;
  }

  export function fromEntity<E>(entityClass) {
    return META.get<E>(entityClass);
  }

  export interface EntityClassMeta<E> {
    entityClass: { new(any?): E };
    table: string;
  }

  export interface EntityDBClassMeta<E, ER= Repository<E>> extends EntityClassMeta<E> {
    db: ER;
  }

  export function tableNameFrom(entityClass: Function | BASE_ENTITY) {
    entityClass = entityClass as Function;
    return `tb_${entityClass.name.toLowerCase()}`
  }


  export class META<E> {

    private _connection: Connection
    metaWithDb<ER>(connection: Connection, entityCustomRepo?: Function) {
      this._connection = connection;
      (this._meta as EntityDBClassMeta<any>).db = this.db(entityCustomRepo);
      return this._meta as EntityDBClassMeta<E, ER>;
    }

    private db<ER>(entityCustomRepo) {
      const res = entityCustomRepo ? this._connection.getCustomRepository(entityCustomRepo) :
        this._connection.getRepository(this._entityClass);
      if (this._config) {
        Object.assign(res, this._config)
      }
      return res as ER;
    }


    public meta() {
      return this._meta;;
    }
    private _meta: EntityClassMeta<E> = {} as any;
    private _config?: Object = {};
    private _entityClass: Function;

    use(config?: Object) {
      this._config = config;
      if (config) {
        Object.assign(this._entityClass.prototype, config);
      }
      return this;
    }

    private static instaces = {};
    public static get<E>(entityClass: Function) {
      if (!META.instaces[entityClass.name]) {
        META.instaces[entityClass.name] = new META();
      }
      const instance = META.instaces[entityClass.name] as META<E>;
      instance._entityClass = entityClass;
      instance._meta.table = tableNameFrom(entityClass);
      return instance;
    }

  }



  export abstract class BASE_REPOSITORY<E> extends Repository<E> {

    abstract get ENTITIES(): { [entities: string]: EntityClassMeta<any> };

  }

  export abstract class BASE_ENTITY {

    abstract id: number;

  }

  export abstract class BASE_CONTROLLER {

    abstract get ENTITIES(): { [entities: string]: EntityDBClassMeta<any, any> };

  }

  export abstract class BASE_MOCK_DATA {

    constructor(public connection: Connection) {

    }
    abstract get CONTROLLERS(): { [controllers: string]: ControllerClassMeta<any> };

  }



}

