// global
import { Entity } from "typeorm/decorator/entity/Entity";
// thirdpart
import { EMAIL as EMAIL_BASE } from "baseline/ss-common-logic/src/entities/EMAIL";
import { __ } from "baseline/ss-common-logic/src/helpers";

@Entity(__(EMAIL))
export class EMAIL extends EMAIL_BASE {

}

export default EMAIL;

