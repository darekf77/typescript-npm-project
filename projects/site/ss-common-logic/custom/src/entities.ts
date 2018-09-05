
import * as _ from 'lodash';


import * as entitiesBaseline from 'baseline/ss-common-logic/src/entities';
export * from 'baseline/ss-common-logic/src/entities';

// import { USER, IUSER, USER_REPOSITORY, BASELINE_USER } from './entities/core/USER';
// export { USER, IUSER, USER_REPOSITORY, BASELINE_USER } from './entities/core/USER';

import { BUILD } from './entities/BUILD';
export { BUILD } from './entities/BUILD';

//#region @backend
import { META, Connection } from "baseline/ss-common-logic/src/helpers";

export function entities(connection?: Connection) {
  return _.merge(entitiesBaseline.entities(connection), {

    // BASELINE_USER: META.repositoryFrom<USER, USER_REPOSITORY>(connection, BASELINE_USER, USER_REPOSITORY),
    // USER: META.repositoryFrom<USER, USER_REPOSITORY>(connection, USER, USER_REPOSITORY),

    BUILD: META.repositoryFrom<BUILD>(connection, BUILD)

  });
}




//#endregion
