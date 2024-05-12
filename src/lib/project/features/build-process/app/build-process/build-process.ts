//#region imports
import { Firedev } from 'firedev/src';
import { _ } from 'tnp-core/src';
import { map } from 'rxjs';
import type { BuildProcessController } from './build-process.controller';
import {
  BuildProcessNonColumnsKeys,
} from './build-process.models';
import {
  BUILD_PROCESS_NON_COL_KEY_ARR,
  DEF_MODEL_VALUE_BUILD_PROCESS as defaultModelValues
} from './build-process.constants';
//#endregion

/**
 * Entity class for BuildProcess
 *
 * + use static methods to for backend access encapsulation
 */
@Firedev.Entity({
  //#region entity options
  className: 'BuildProcess',
  defaultModelValues,
  //#region @websql
  createTable: false,
  //#endregion
  //#endregion
})
export class BuildProcess extends Firedev.Base.Entity {
  //#region static
  static ctrl: BuildProcessController;
  static from(obj: Omit<Partial<BuildProcess>, BuildProcessNonColumnsKeys>) {
    obj = _.merge(defaultModelValues, _.omit(obj, BUILD_PROCESS_NON_COL_KEY_ARR))
    return _.merge(new BuildProcess(), obj) as BuildProcess;
  }
  static $getAll() {
    return this.ctrl.getAll().received?.observable.pipe(
      map(data => data.body?.json || [])
    );
  }

  static async getAll() {
    const data = await this.ctrl.getAll().received;
    return data?.body?.json || [];
  }

  static emptyModel() {
    return BuildProcess.from(defaultModelValues);
  }

  //#endregion

  //#region fields & getters
  ctrl: BuildProcessController;

  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: string;

  //#region @websql
  @Firedev.Orm.Column.Custom({
    type: 'varchar',
    length: 100,
    default: defaultModelValues.description
  })
  //#endregion
  description?: string;
  //#endregion

  //#region methods
  clone(options?: { propsToOmit: (keyof BuildProcess)[]; }): BuildProcess {
    const { propsToOmit } = options || { propsToOmit: BUILD_PROCESS_NON_COL_KEY_ARR };
    return _.merge(new BuildProcess(), _.omit(this, propsToOmit));
  }
  //#endregion
}
