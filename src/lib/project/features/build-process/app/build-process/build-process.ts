//#region imports
import { Taon } from 'taon/src';
import { _ } from 'tnp-core/src';
//#endregion

/**
 * Entity class for BuildProcess
 *
 * + use static methods to for backend access encapsulation
 */
@Taon.Entity({
  //#region entity options
  className: 'BuildProcess',
  //#endregion
})
export class BuildProcess extends Taon.Base.AbstractEntity<BuildProcess> {
  //#region @websql
  @Taon.Orm.Column.Custom({
    type: 'varchar',
    length: 100,
    default: '',
  })
  //#endregion
  description?: string;

  //#region @websql
  @Taon.Orm.Column.Number()
  //#endregion
  backendPort: number;

  //#region @websql
  @Taon.Orm.Column.Number()
  //#endregion
  standaloneNormalAppPort: number;

  //#region @websql
  @Taon.Orm.Column.Number()
  //#endregion
  standaloneWebsqlAppPort: number;

}
