//#region entities
import { USER, IUSER, USER_REPOSITORY } from './entities/USER';
import { SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from './entities/SESSION';
import { EMAIL, EMAIL_REPOSITORY } from './entities/EMAIL';
import { EMAIL_TYPE, EMAIL_TYPE_NAME, EMAIL_TYPE_REPOSITORY } from './entities/EMAIL_TYPE';
//#endregion

import { META, Connection } from './helpers';

export function entities(connection?: Connection) {
  return {
    USER: META.repositoryFrom<USER, USER_REPOSITORY>(connection, USER, USER_REPOSITORY),
    SESSION: META.repositoryFrom<SESSION, SESSION_REPOSITORY>(connection, SESSION, SESSION_REPOSITORY),
    EMAIL: META.repositoryFrom<EMAIL, EMAIL_REPOSITORY>(connection, EMAIL, EMAIL_REPOSITORY),
    EMAIL_TYPE: META.repositoryFrom<EMAIL, EMAIL_TYPE_REPOSITORY>(connection, EMAIL, EMAIL_TYPE_REPOSITORY)
  }

}
