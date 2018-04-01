import { Entity } from 'typeorm/decorator/entity/Entity';
import { Column, EntityRepository, ManyToMany } from 'typeorm';

import {
  EMAIL_TYPE as BASELINE_EMAIL_TYPE,
  EMAIL_TYPE_REPOSITORY as BASELINE_EMAIL_TYPE_REPOSITORY
} from "baseline-ss-common-logic/entities/EMAIL_TYPE";
import { EMAIL_DECORATOR } from './EMAIL';
import { META } from "baseline-ss-common-logic/helpers";

export {
  EMAIL_TYPE_NAME
} from "baseline-ss-common-logic/entities/EMAIL_TYPE";


@Entity(META.tableNameFrom(EMAIL_TYPE_DECORATOR))
export class EMAIL_TYPE_DECORATOR extends BASELINE_EMAIL_TYPE {


}


@EntityRepository(EMAIL_TYPE_DECORATOR)
export class EMAIL_TYPE_REPOSITORY extends BASELINE_EMAIL_TYPE_REPOSITORY {

}
