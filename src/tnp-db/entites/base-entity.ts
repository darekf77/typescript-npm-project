import * as _ from 'lodash'
import { CLASS } from 'typescript-class-helpers'

export abstract class DBBaseEntity<T> {
  abstract isEqual(anotherInstace: DBBaseEntity<any>): boolean;


  entityName() {
    return DBBaseEntity.entityFromClassName(CLASS.getNameFromObject(this) as string)
  }

  public static entityFromClassName(className: string) {
    return _.lowerCase((CLASS.getNameFromObject(this) as string).replace('Instance', 's'))
  }

}
