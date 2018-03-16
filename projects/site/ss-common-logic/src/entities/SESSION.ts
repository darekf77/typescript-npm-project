// global
import { Entity } from "typeorm/decorator/entity/Entity";
// thirdpart
import { SESSION as SESSION_BASE } from "baseline/ss-common-logic/src/entities/SESSION";
import { __ } from "baseline/ss-common-logic/src/helpers";


@Entity(__(SESSION))
export class SESSION extends SESSION_BASE {

}

export default SESSION;

