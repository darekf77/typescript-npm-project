
import { Column, Entity } from "typeorm";
import { META } from "baseline/ss-common-logic/src/helpers";
import { USER as BASELINE_USER } from "baseline/ss-common-logic/src/entities/core/USER";
export { USER as BASELINE_USER } from "baseline/ss-common-logic/src/entities/core/USER";
export * from "baseline/ss-common-logic/src/entities/core/USER";

@Entity(META.tableNameFrom(USER))
export class USER extends BASELINE_USER {

    @Column({ nullable: true }) whereCreated: 'baseline' | 'site' = 'site';

}

export default USER;
