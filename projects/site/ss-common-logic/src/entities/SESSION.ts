// global
import { Entity } from "typeorm/decorator/entity/Entity";
import { Repository, EntityRepository, Connection, OneToOne, JoinColumn } from 'typeorm';
// thirdpart
import {
  SESSION as BASELINE_SESSION,
  SESSION_REPOSITORY as BASELINE_SESSION_REPOSITORY,
  SESSION_CONFIG as BASELINE_SESSION_CONFIG
} from "baseline/ss-common-logic/bundle/entities/SESSION";
import { META } from "baseline/ss-common-logic/bundle/helpers";
import { USER } from './USER';


BASELINE_SESSION_CONFIG.SESSION_TIME_SECONDS = 300;

export const SESSION_CONFIG = BASELINE_SESSION_CONFIG;


@Entity(META.tableNameFrom(SESSION))
export class SESSION extends BASELINE_SESSION {

  @OneToOne(type => USER, user => user.id, {
    nullable: true
  })
  @JoinColumn()
  user: USER;

}


@EntityRepository(SESSION)
export class SESSION_REPOSITORY extends BASELINE_SESSION_REPOSITORY {


}

export default SESSION;

