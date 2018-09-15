import * as baslineEntites from 'baseline/ss-common-logic/src/entities';
export * from 'baseline/ss-common-logic/src/entities';

import { BUILD } from './entities/BUILD';
export { BUILD } from './entities/BUILD';

import { BUILD_REPOSITORY } from './repositories/BUILD_REPOSITORY';
export { BUILD_REPOSITORY } from './repositories/BUILD_REPOSITORY';

import { DOMAIN, DOMAIN_REPOSITORY } from './entities/DOMAIN';
export { DOMAIN, DOMAIN_REPOSITORY } from './entities/DOMAIN';




//#region @backend
import * as _ from 'lodash';
import { META, Connection } from "morphi";


export function entities(connection?: Connection) {
  return _.merge(baslineEntites.entities(connection), {

    BUILD: META.repositoryFrom<BUILD, BUILD_REPOSITORY>(connection as any, BUILD, BUILD_REPOSITORY),

    DOMAIN: META.repositoryFrom<DOMAIN, DOMAIN_REPOSITORY>(connection as any, DOMAIN, DOMAIN_REPOSITORY)

  });
}




//#endregion
