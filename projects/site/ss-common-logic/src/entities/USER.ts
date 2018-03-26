import {
  USER as BASELINE_USER,
  USER_REPOSITORY as BASELINE_USER_REPOSITORY
} from "baseline/ss-common-logic/bundle/entities/USER";
export {
  IUSER
} from "baseline/ss-common-logic/bundle/entities/USER";


import { Entity } from 'typeorm/decorator/entity/Entity';
import { META } from 'baseline/ss-common-logic/bundle/helpers';
import { Column, EntityRepository, OneToMany } from 'typeorm';
import { EMAIL } from './EMAIL';

@Entity(META.tableNameFrom(USER))
export class USER extends BASELINE_USER {

  @Column() whereCreated: 'baseline' | 'site' = 'site';

  //#region @cutForSite
  @OneToMany(type => EMAIL, email => email.user, {
    cascadeUpdate: false,
    cascadeInsert: false
  })
  //#endregion
  emails: EMAIL[] = [];
}

@EntityRepository(USER)
export class USER_REPOSITORY extends BASELINE_USER_REPOSITORY {


}
