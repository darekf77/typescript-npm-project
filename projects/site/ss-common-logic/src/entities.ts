//#region entities
import { USER, IUSER, USER_REPOSITORY } from 'baseline/ss-common-logic/bundle/entities/USER';
import { EMAIL, EMAIL_REPOSITORY } from 'baseline/ss-common-logic/bundle/entities/EMAIL';
import { EMAIL_TYPE, EMAIL_TYPE_NAME, EMAIL_TYPE_REPOSITORY } from 'baseline/ss-common-logic/bundle/entities/EMAIL_TYPE';
// overrided
import { SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from './entities/SESSION';
//#endregion

import { META, Connection } from 'baseline/ss-common-logic/bundle/helpers';

export function entities(connection?: Connection) {
  return {
    USER: META
      .fromEntity<USER>(USER)
      .metaWithDb<USER_REPOSITORY>(connection, USER_REPOSITORY),
    SESSION: META
      .fromEntity<SESSION>(SESSION)
      .use(SESSION_CONFIG)
      .metaWithDb<SESSION_REPOSITORY>(connection, SESSION_REPOSITORY),
    EMAIL: META
      .fromEntity<EMAIL>(EMAIL)
      .metaWithDb<EMAIL_REPOSITORY>(connection, EMAIL_REPOSITORY),
    EMAIL_TYPE: META
      .fromEntity<EMAIL_TYPE>(EMAIL_TYPE)
      .metaWithDb<EMAIL_TYPE_REPOSITORY>(connection, EMAIL_TYPE_REPOSITORY)
  }
}
