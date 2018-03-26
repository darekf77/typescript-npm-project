// global
import { Entity } from "typeorm/decorator/entity/Entity";
import { Repository, EntityRepository, Connection } from 'typeorm';
// thirdpart
import {
  SESSION as BASELINE_SESSION,
  SESSION_REPOSITORY as BASELINE_SESSION_REPOSITORY,
  SESSION_CONFIG as BASELINE_SESSION_CONFIG
} from "baseline/ss-common-logic/bundle/entities/SESSION";
import { META } from "baseline/ss-common-logic/bundle/helpers";


BASELINE_SESSION_CONFIG.SESSION_TIME_SECONDS = 300;

export const SESSION_CONFIG = BASELINE_SESSION_CONFIG;


@Entity(META.tableNameFrom(SESSION))
export class SESSION extends BASELINE_SESSION {

}


@EntityRepository(SESSION)
export class SESSION_REPOSITORY extends BASELINE_SESSION_REPOSITORY {

  get ENTITIES() {
    return {
      SESSION: META.fromEntity<SESSION>(SESSION).meta()
    }
  }

}


export const SESSION_META = function (connection: Connection) {
  return META
    .fromEntity<SESSION>(SESSION)
    .use(SESSION_CONFIG)
    .metaWithDb<SESSION_REPOSITORY>(connection as any, SESSION_REPOSITORY);
}

export default SESSION;

