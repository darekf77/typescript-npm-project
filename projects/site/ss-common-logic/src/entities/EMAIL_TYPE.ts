import { Entity } from 'typeorm/decorator/entity/Entity';
import { META } from 'baseline/ss-common-logic/bundle/helpers';
import { Column, EntityRepository, ManyToMany } from 'typeorm';

import {
    EMAIL_TYPE as BASELINE_EMAIL_TYPE,
    EMAIL_TYPE_REPOSITORY as BASELINE_EMAIL_TYPE_REPOSITORY
} from "baseline/ss-common-logic/bundle/entities/EMAIL_TYPE";
import { EMAIL } from './EMAIL';

export {
    EMAIL_TYPE_NAME
} from "baseline/ss-common-logic/bundle/entities/EMAIL_TYPE";


@Entity(META.tableNameFrom(EMAIL_TYPE))
export class EMAIL_TYPE extends BASELINE_EMAIL_TYPE {

    @ManyToMany(type => EMAIL, email => email.types, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    emails: EMAIL[] = [];

}


@EntityRepository(EMAIL_TYPE)
export class EMAIL_TYPE_REPOSITORY extends BASELINE_EMAIL_TYPE_REPOSITORY {

}