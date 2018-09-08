import * as baslineEntites from 'baseline/ss-common-logic/src/entities';
export * from 'baseline/ss-common-logic/src/entities';

import { BUILD, BUILD_REPOSITORY } from './entities/BUILD';
export { BUILD, BUILD_REPOSITORY } from './entities/BUILD';

import { DOMAIN, DOMAIN_REPOSITORY } from './entities/DOMAIN';
export { DOMAIN, DOMAIN_REPOSITORY } from './entities/DOMAIN';




//#region @backend
import * as _ from 'lodash';
import { META, Connection } from "baseline/ss-common-logic/src/helpers";

export function entities(connection?: Connection) {
  return _.merge(baslineEntites.entities(connection), {

    BUILD: META.repositoryFrom<BUILD, BUILD_REPOSITORY>(connection as any, BUILD, BUILD_REPOSITORY),

    DOMAIN: META.repositoryFrom<DOMAIN, DOMAIN_REPOSITORY>(connection as any, DOMAIN, DOMAIN_REPOSITORY)

  });
}




//#endregion
