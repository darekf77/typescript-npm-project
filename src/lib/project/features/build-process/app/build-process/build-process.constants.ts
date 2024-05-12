//#region imports
import { _ } from 'tnp-core/src';
import type { IBuildProcess, BuildProcessNonColumnsKeys } from './build-process.models';
//#endregion

//#region constants
export const BUILD_PROCESS_TABLE_NAME = _.snakeCase('buildProcess').toUpperCase();
export const BUILD_PROCESS_NON_COL_KEY_ARR = [
  'ctrl',
  'clone',
  '__endpoint_context__',
  'inject',
  '_'
] as BuildProcessNonColumnsKeys[];

export const DEF_MODEL_VALUE_BUILD_PROCESS: Omit<IBuildProcess, BuildProcessNonColumnsKeys> = {
  description: 'BuildProcess example description',
}
//#endregion
