// global
import { Entity } from "typeorm/decorator/entity/Entity";
// thirdpart
import { USER as USER_BASE } from "baseline/ss-common-logic/src/entities/USER";
import { __ } from "baseline/ss-common-logic/src/helpers";

@Entity(__(USER))
export class USER extends USER_BASE {

}

export default USER;

