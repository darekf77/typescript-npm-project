// global
import { Entity } from "typeorm/decorator/entity/Entity";
import { Repository, EntityRepository } from 'typeorm';
// thirdpart
import {
    SESSION as BASELINE_SESSION,
    SESSION_REPOSITORY as BASELINE_SESSION_REPOSITORY,
    SESSION_CONFIG as BASELINE_SESSION_CONFIG
} from "baseline/ss-common-logic/bundle/entities/SESSION";
import { tableNameFrom } from "baseline/ss-common-logic/src/helpers";
import { ENTITIES } from './index';


BASELINE_SESSION_CONFIG.SESSION_TIME_SECONDS = 300;

export const SESSION_CONFIG = BASELINE_SESSION_CONFIG;


@Entity(tableNameFrom(SESSION))
export class SESSION extends BASELINE_SESSION {

}


@EntityRepository(SESSION)
export class SESSION_REPOSITORY extends BASELINE_SESSION_REPOSITORY {

    ENTITIES = ENTITIES();

}

export default SESSION;

