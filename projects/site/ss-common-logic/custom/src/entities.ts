import * as _ from 'lodash';

import * as entitiesBaseline from 'baseline/ss-common-logic/src/entities';
export * from 'baseline/ss-common-logic/src/entities';

//#region @backend
import { META, Connection } from "baseline/ss-common-logic/src/helpers";
import BUILD from './entities/BUILD';


export function entities(connection?: Connection) {
  return _.merge({

    BUILD: META.repositoryFrom<BUILD>(connection, BUILD)

  }, entitiesBaseline.entities(connection));
}


//#endregion
