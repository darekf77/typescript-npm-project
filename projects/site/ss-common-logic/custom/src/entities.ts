
import * as _ from 'lodash';


import * as entitiesBaseline from 'baseline/ss-common-logic/src/entities';
export * from 'baseline/ss-common-logic/src/entities';


import { USER, BASELINE_USER, IUSER, USER_REPOSITORY } from './entities/core/USER';
export { USER, BASELINE_USER, IUSER, USER_REPOSITORY } from './entities/core/USER';

import { BUILD } from './entities/BUILD';
export { BUILD } from './entities/BUILD';

//#region @backend
import { META, Connection } from "baseline/ss-common-logic/src/helpers";

export function entities(connection?: Connection) {
  return _.merge({

    BASELINE_USER: META.repositoryFrom<BASELINE_USER, USER_REPOSITORY>(connection, BASELINE_USER, USER_REPOSITORY),
    USER: META.repositoryFrom<USER, USER_REPOSITORY>(connection, USER, USER_REPOSITORY),

    BUILD: META.repositoryFrom<BUILD>(connection, BUILD)

  }, entitiesBaseline.entities(connection));
}




//#endregion
