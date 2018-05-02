import { USER, IUSER, USER_REPOSITORY } from './entities/core/USER';
export { USER, IUSER, USER_REPOSITORY } from './entities/core/USER';

import { SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from './entities/core/SESSION';
export { SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from './entities/core/SESSION';

import { EMAIL, EMAIL_REPOSITORY } from './entities/core/EMAIL';
export { EMAIL, EMAIL_REPOSITORY } from './entities/core/EMAIL';

import { EMAIL_TYPE, EMAIL_TYPE_NAME, EMAIL_TYPE_REPOSITORY } from './entities/core/EMAIL_TYPE';
export { EMAIL_TYPE, EMAIL_TYPE_NAME, EMAIL_TYPE_REPOSITORY } from './entities/core/EMAIL_TYPE';

import { DIALOG, IDIALOG } from "./entities/DIALOG";
export { DIALOG, IDIALOG } from "./entities/DIALOG";

import { CATEGORY, ICATEGORY } from "./entities/CATEGORY";
export { CATEGORY, ICATEGORY } from "./entities/CATEGORY";

import { GROUP, IGROUP } from "./entities/GROUP";
export { GROUP, IGROUP } from "./entities/GROUP";


//#region @backend
import { Repository } from "typeorm";
export { Repository } from "typeorm";

import { META, Connection } from './helpers';
export function entities(connection?: Connection) {
  return {
    USER: META.repositoryFrom<USER, USER_REPOSITORY>(connection, USER, USER_REPOSITORY),
    SESSION: META.repositoryFrom<SESSION, SESSION_REPOSITORY>(connection, SESSION, SESSION_REPOSITORY),
    EMAIL: META.repositoryFrom<EMAIL, EMAIL_REPOSITORY>(connection, EMAIL, EMAIL_REPOSITORY),
    EMAIL_TYPE: META.repositoryFrom<EMAIL, EMAIL_TYPE_REPOSITORY>(connection, EMAIL, EMAIL_TYPE_REPOSITORY),
    DIALOG: META.repositoryFrom<DIALOG>(connection, DIALOG),
    CATEGORY: META.repositoryFrom<CATEGORY>(connection, CATEGORY),
    GROUP: META.repositoryFrom<GROUP>(connection, GROUP)
  }
}
//#endregion
