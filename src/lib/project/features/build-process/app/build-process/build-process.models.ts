//#region imports
import type { BuildProcess } from "./build-process";
import { _ } from 'tnp-core/src';
import { BUILD_PROCESS_TABLE_NAME, DEF_MODEL_VALUE_BUILD_PROCESS } from "./build-process.constants";
//#region @websql
import { NumberColumn, PropsEntitySQL, QueryTable, StringColumn } from "firedev-type-sql/src";
//#endregion
//#endregion

//#region build process non columns key type
export type BuildProcessNonColumnsKeys =
  'ctrl' |
  '__endpoint_context__' |
  'inject' |
  '_' |
  'clone';
//#endregion

//#region build process partial type
export type IBuildProcess = Partial<BuildProcess>;
//#endregion

//#region build process table
//#region @websql
export type IBuildProcessTable = PropsEntitySQL<typeof DEF_MODEL_VALUE_BUILD_PROCESS>;

export class BuildProcessTable extends QueryTable<BuildProcess, number> implements IBuildProcessTable {
  id = new NumberColumn(this, 'id');
  description = new StringColumn(this, 'description');

}

export const BUILD_PROCESS = new BuildProcessTable(BUILD_PROCESS_TABLE_NAME);
//#endregion
//#endregion
