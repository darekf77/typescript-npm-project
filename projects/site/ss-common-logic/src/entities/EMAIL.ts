import { Entity } from 'typeorm/decorator/entity/Entity';
import { META } from 'baseline/ss-common-logic/bundle/helpers';
import { Column, EntityRepository, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';


import {
    EMAIL as BASELINE_EMAIL,
    EMAIL_REPOSITORY as BASELINE_EMAIL_REPOSITORY
} from "baseline/ss-common-logic/bundle/entities/EMAIL";
import { EMAIL_TYPE } from './EMAIL_TYPE';
import { USER } from './USER';

@Entity(META.tableNameFrom(EMAIL))
export class EMAIL extends BASELINE_EMAIL {

    @ManyToMany(type => EMAIL_TYPE, type => type.emails, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    @JoinTable()
    types: EMAIL_TYPE[] = [];


    @ManyToOne(type => USER, user => user.id, {
        cascadeAll: false
    })
    @JoinColumn()
    user: USER;

}

@EntityRepository(EMAIL)
export class EMAIL_REPOSITORY extends BASELINE_EMAIL_REPOSITORY {

}
