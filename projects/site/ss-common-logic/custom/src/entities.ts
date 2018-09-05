import * as baslineEntites from 'baseline/ss-common-logic/src/entities';
export * from 'baseline/ss-common-logic/src/entities';

import { BUILD } from './entities/BUILD';
export { BUILD } from './entities/BUILD';


//#region @backend
import * as _ from 'lodash';
import { META, Connection } from "baseline/ss-common-logic/src/helpers";

export function entities(connection?: Connection) {
  return _.merge(baslineEntites.entities(connection), {

    BUILD: META.repositoryFrom<BUILD>(connection as any, BUILD)

  });
}




//#endregion
