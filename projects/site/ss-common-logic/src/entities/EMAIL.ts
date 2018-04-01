import { Entity } from 'typeorm/decorator/entity/Entity';
import { Column, EntityRepository, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';


import {
  EMAIL as BASELINE_EMAIL,
  EMAIL_REPOSITORY as BASELINE_EMAIL_REPOSITORY
} from "baseline-ss-common-logic/entities/EMAIL";
import { EMAIL_TYPE_DECORATOR } from './EMAIL_TYPE';
import { USER_DECORATOR } from './USER';
import { META } from "baseline-ss-common-logic/helpers";

@Entity(META.tableNameFrom(EMAIL_DECORATOR))
export class EMAIL_DECORATOR extends BASELINE_EMAIL {


}

@EntityRepository(EMAIL_DECORATOR)
export class EMAIL_REPOSITORY extends BASELINE_EMAIL_REPOSITORY {

}
