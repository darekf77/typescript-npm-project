//#region @backend
import * as _ from 'lodash'
import { CLASS } from 'typescript-class-helpers'

export abstract class DBBaseEntity<T=any> {
  abstract isEqual(anotherInstace: DBBaseEntity<any>): boolean;


  entityName() {
    return DBBaseEntity.entityNameFromClassName(CLASS.getNameFromObject(this) as string)
  }

  public static entityNameFromClassName(className: string) {
    return _.lowerCase(className.replace('Instance', 's'))
  }

}
//#endregion
