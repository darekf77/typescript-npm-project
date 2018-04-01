import {
  USER as BASELINE_USER,
  USER_REPOSITORY as BASELINE_USER_REPOSITORY
} from "baseline-ss-common-logic/entities/USER";
export {
  IUSER
} from "baseline-ss-common-logic/entities/USER";


import { Entity, Column, EntityRepository, OneToMany } from 'typeorm';
import { EMAIL_DECORATOR } from './EMAIL';
import { META } from "baseline-ss-common-logic/helpers";


@Entity(META.tableNameFrom(USER_DECORATOR))
export class USER_DECORATOR extends BASELINE_USER {

  @Column() whereCreated: 'baseline' | 'site' = 'site';


}

@EntityRepository(USER_DECORATOR)
export class USER_REPOSITORY extends BASELINE_USER_REPOSITORY {


}
