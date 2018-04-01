// global
import { Entity } from "typeorm/decorator/entity/Entity";
import { Repository, EntityRepository, Connection, OneToOne, JoinColumn } from 'typeorm';
// thirdpart
import {
  SESSION as BASELINE_SESSION,
  SESSION_REPOSITORY as BASELINE_SESSION_REPOSITORY,
  SESSION_CONFIG as BASELINE_SESSION_CONFIG
} from "baseline-ss-common-logic/entities/SESSION";
import { USER_DECORATOR } from './USER';
import { META } from "baseline-ss-common-logic/helpers";


BASELINE_SESSION_CONFIG.SESSION_TIME_SECONDS = 300;

export const SESSION_CONFIG = BASELINE_SESSION_CONFIG;


@Entity(META.tableNameFrom(SESSION_DECORATOR))
export class SESSION_DECORATOR extends BASELINE_SESSION {


}


@EntityRepository(SESSION_DECORATOR)
export class SESSION_REPOSITORY extends BASELINE_SESSION_REPOSITORY {


}

export default SESSION_DECORATOR;

