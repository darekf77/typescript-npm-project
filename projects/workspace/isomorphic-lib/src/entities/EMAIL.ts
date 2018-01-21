import {
    Entity, PrimaryColumn, Column,
    Connection, OneToMany, ManyToOne,
    JoinColumn, ManyToMany, JoinTable,
    PrimaryGeneratedColumn
} from "typeorm";
import { Router, Request, Response } from "express";

import USER from "./USER";
import EMAIL_TYPE from './EMAIL_TYPE';



@Entity()
export class EMAIL {

    constructor(address: string) {
        this.address = address;
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 100, unique: true })
    address: string;


    @ManyToMany(type => EMAIL_TYPE, email_type => email_type.emails, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    @JoinTable({
        name: 'EMAILS_AND_TYPES'
    })
    types: EMAIL_TYPE[] = [];


    @ManyToOne(type => USER, user => user.id, {
        cascadeAll: false
    })
    @JoinColumn()
    user: USER;

    public static get types() {
        return EMAIL_TYPE.types
    }

}

export default EMAIL;