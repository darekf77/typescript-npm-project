
import { BUILD } from './entities/BUILD';
export { BUILD } from './entities/BUILD';


//#region @backend
import { META, Connection } from "baseline/ss-common-logic/src/helpers";

export function entities(connection?: Connection) {
  return {

    BUILD: META.repositoryFrom<BUILD>(connection, BUILD)

  }
}




//#endregion
