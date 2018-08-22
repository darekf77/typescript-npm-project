import { USER, IUSER, USER_REPOSITORY } from './entities/core/USER';
export { USER, IUSER, USER_REPOSITORY } from './entities/core/USER';

import { SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from './entities/core/SESSION';
export { SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from './entities/core/SESSION';

import { MULTIMEDIA, IMULTIMEDIA, MULTIMEDIA_REPOSITORY } from './entities/core/MULTIMEDIA';
export { MULTIMEDIA, IMULTIMEDIA, MULTIMEDIA_REPOSITORY } from './entities/core/MULTIMEDIA';

import { EMAIL, EMAIL_REPOSITORY } from './entities/core/EMAIL';
export { EMAIL, EMAIL_REPOSITORY } from './entities/core/EMAIL';

import { EMAIL_TYPE, EMAIL_TYPE_NAME, EMAIL_TYPE_REPOSITORY } from './entities/core/EMAIL_TYPE';
export { EMAIL_TYPE, EMAIL_TYPE_NAME, EMAIL_TYPE_REPOSITORY } from './entities/core/EMAIL_TYPE';

import { DIALOG, IDIALOG, DIALOG_REPOSITORY } from "./entities/DIALOG";
export { DIALOG, IDIALOG, DIALOG_REPOSITORY } from "./entities/DIALOG";

import { CATEGORY, ICATEGORY, CATEGORY_REPOSITORY } from "./entities/CATEGORY";
export { CATEGORY, ICATEGORY, CATEGORY_REPOSITORY } from "./entities/CATEGORY";

import { GROUP, IGROUP, GROUP_REPOSITORY } from "./entities/GROUP";
export { GROUP, IGROUP, GROUP_REPOSITORY } from "./entities/GROUP";

import { EXAMPLE, IEXAMPLE, EXAMPLE_REPOSITORY } from './entities/EXAMPLE';
export { EXAMPLE, IEXAMPLE, EXAMPLE_REPOSITORY } from './entities/EXAMPLE';

import { CONFIG, ICONFIG, CONFIG_REPOSITORY } from './entities/CONFIG';
export { CONFIG, ICONFIG, CONFIG_REPOSITORY } from './entities/CONFIG';

import { EXAMPLE_PAGINATION, IEXAMPLE_PAGINATION, EXAMPLE_PAGINATION_REPOSITORY }
  from './entities/EXAMPLE_PAGINATION';
export { EXAMPLE_PAGINATION, IEXAMPLE_PAGINATION, EXAMPLE_PAGINATION_REPOSITORY }
  from './entities/EXAMPLE_PAGINATION';

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

    DIALOG: META.repositoryFrom<DIALOG, DIALOG_REPOSITORY>(connection, DIALOG, DIALOG_REPOSITORY),

    CATEGORY: META.repositoryFrom<CATEGORY, CATEGORY_REPOSITORY>(connection, CATEGORY, CATEGORY_REPOSITORY),

    GROUP: META.repositoryFrom<GROUP, GROUP_REPOSITORY>(connection, GROUP, GROUP_REPOSITORY),

    MULTIMEDIA: META.repositoryFrom<MULTIMEDIA, MULTIMEDIA_REPOSITORY>(connection, MULTIMEDIA, MULTIMEDIA_REPOSITORY),

    CONFIG: META.repositoryFrom<CONFIG, CONFIG_REPOSITORY>(connection, CONFIG, CONFIG_REPOSITORY);

    EXAMPLE: META.repositoryFrom<EXAMPLE, EXAMPLE_REPOSITORY>(connection, EXAMPLE, EXAMPLE_REPOSITORY),

    EXAMPLE_PAGINATION: META
      .repositoryFrom<EXAMPLE_PAGINATION, EXAMPLE_PAGINATION_REPOSITORY>(
        connection,
        EXAMPLE_PAGINATION,
        EXAMPLE_PAGINATION_REPOSITORY
      )
  }
}
//#endregion
