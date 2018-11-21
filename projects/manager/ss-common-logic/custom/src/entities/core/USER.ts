
import { Column, Entity } from "typeorm";
import { CLASSNAME, EntityRepository, META } from "morphi";

import {
  USER as BASELINE_USER
} from "baseline/ss-common-logic/src/entities/core/USER";

export * from "baseline/ss-common-logic/src/entities/core/USER";

//#region @backend
@Entity(META.tableNameFrom(USER))
//#endregion
@CLASSNAME('USER')
export class USER extends BASELINE_USER {

  @Column({ nullable: true }) whereCreated: 'baseline' | 'site' = 'site';

}
