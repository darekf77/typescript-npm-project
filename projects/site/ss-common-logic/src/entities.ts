//#region entities
import { EMAIL_TYPE_DECORATOR, EMAIL_TYPE_NAME, EMAIL_TYPE_REPOSITORY } from './entities/EMAIL_TYPE';
import { EMAIL_DECORATOR, EMAIL_REPOSITORY } from './entities/EMAIL';
import { USER_DECORATOR, USER_REPOSITORY, IUSER } from './entities/USER';
import { SESSION_DECORATOR, SESSION_CONFIG, SESSION_REPOSITORY } from './entities/SESSION';
//#endregion

import { Connection } from 'baseline-ss-common-logic/helpers';
import { META } from "baseline-ss-common-logic/helpers";

export function entities(connection?: Connection) {
  return {
    USER: META
      .fromEntity<USER_DECORATOR>(USER_DECORATOR)
      .metaWithDb<USER_REPOSITORY>(connection as any, USER_REPOSITORY),
    SESSION: META
      .fromEntity<SESSION_DECORATOR>(SESSION_DECORATOR)
      .use(SESSION_CONFIG)
      .metaWithDb<SESSION_REPOSITORY>(connection as any, SESSION_REPOSITORY),
    EMAIL: META
      .fromEntity<EMAIL_DECORATOR>(EMAIL_DECORATOR)
      .metaWithDb<EMAIL_REPOSITORY>(connection as any, EMAIL_REPOSITORY),
    EMAIL_TYPE: META
      .fromEntity<EMAIL_TYPE_DECORATOR>(EMAIL_TYPE_DECORATOR)
      .metaWithDb<EMAIL_TYPE_REPOSITORY>(connection as any, EMAIL_TYPE_REPOSITORY)
  }
}
