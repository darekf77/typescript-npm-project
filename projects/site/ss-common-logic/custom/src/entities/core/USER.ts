
import { Column, Entity } from "typeorm";
import { META } from "baseline/ss-common-logic/src/helpers";
import { CLASSNAME, EntityRepository } from "morphi";

import {
  USER as BASELINE_USER, USER_REPOSITORY as BASELINE_USER_REPOSITORY
} from "baseline/ss-common-logic/src/entities/core/USER";

export * from "baseline/ss-common-logic/src/entities/core/USER";

//#region @backend
@Entity(META.tableNameFrom(USER))
//#endregion
@CLASSNAME('USER')
export class USER extends BASELINE_USER {

  @Column({ nullable: true }) whereCreated: 'baseline' | 'site' = 'site';

}

@EntityRepository(USER)
export class USER_REPOSITORY extends BASELINE_USER_REPOSITORY {

}

export default USER;
