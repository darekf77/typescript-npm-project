//#region entities
import { EMAIL_TYPE, EMAIL_TYPE_NAME, EMAIL_TYPE_REPOSITORY } from './entities/EMAIL_TYPE';
import { EMAIL, EMAIL_REPOSITORY } from './entities/EMAIL';
import { USER, USER_REPOSITORY, IUSER } from './entities/USER';
import { SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from './entities/SESSION';
//#endregion

import { META, Connection } from 'baseline/ss-common-logic/bundle/helpers';

export function entities(connection?: Connection) {
  return {
    USER: META
      .fromEntity<USER>(USER)
      .metaWithDb<USER_REPOSITORY>(connection as any, USER_REPOSITORY),
    SESSION: META
      .fromEntity<SESSION>(SESSION)
      .use(SESSION_CONFIG)
      .metaWithDb<SESSION_REPOSITORY>(connection as any, SESSION_REPOSITORY),
    EMAIL: META
      .fromEntity<EMAIL>(EMAIL)
      .metaWithDb<EMAIL_REPOSITORY>(connection as any, EMAIL_REPOSITORY),
    EMAIL_TYPE: META
      .fromEntity<EMAIL_TYPE>(EMAIL_TYPE)
      .metaWithDb<EMAIL_TYPE_REPOSITORY>(connection as any, EMAIL_TYPE_REPOSITORY)
  }
}
