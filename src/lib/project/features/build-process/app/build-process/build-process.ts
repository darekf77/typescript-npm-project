//#region imports
import { Firedev } from 'firedev/src';
import { _ } from 'tnp-core/src';
//#endregion

/**
 * Entity class for BuildProcess
 *
 * + use static methods to for backend access encapsulation
 */
@Firedev.Entity({
  //#region entity options
  className: 'BuildProcess',
  //#endregion
})
export class BuildProcess extends Firedev.Base.AbstractEntity {
  //#region @websql
  @Firedev.Orm.Column.Custom({
    type: 'varchar',
    length: 100,
    default: '',
  })
  //#endregion
  description?: string;
}
