// global
import { Entity } from "typeorm/decorator/entity/Entity";
// thirdpart
import { EMAIL_TYPE as EMAIL_TYPE_BASE } from "baseline/ss-common-logic/src/entities/EMAIL_TYPE";
import { __ } from "baseline/ss-common-logic/src/helpers";


@Entity(__(EMAIL_TYPE))
export class EMAIL_TYPE extends EMAIL_TYPE_BASE {

}

export default EMAIL_TYPE;

