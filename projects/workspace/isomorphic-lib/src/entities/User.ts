import {
    Entity, PrimaryColumn, Column,
    Connection, OneToMany, ManyToMany, JoinTable,
    AfterInsert, AfterUpdate, BeforeUpdate,
    PrimaryGeneratedColumn
} from "typeorm";
import { Router, Request, Response } from 'express';
import { authenticate } from "passport";

import { EMAIL } from "./EMAIL";
import { EMAIL_TYPE } from "./EMAIL_TYPE";

export interface IUSER {
    email?: string;
    username: string;
    password: string;
    firstname?: string;
    lastname?: string;
    city?: string;
    email_type?: EMAIL_TYPE;
}


@Entity(USER.name)
export class USER implements IUSER {

    @PrimaryGeneratedColumn()
    id: number;

    @Column() username: string;
    @Column() password: string;
    @Column({ nullable: true }) firstname: string;
    @Column({ nullable: true }) lastname: string;
    @Column({ nullable: true }) email?: string;

    @OneToMany(type => EMAIL, email => email.user, {
        cascadeUpdate: false,
        cascadeInsert: false
    })
    emails: EMAIL[] = [];

    session_expire_in: number;

}


export default USER;