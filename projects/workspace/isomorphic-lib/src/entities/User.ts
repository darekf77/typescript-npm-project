import {
    Entity, PrimaryColumn, Column,
    Connection, OneToMany, ManyToMany, JoinTable,
    AfterInsert, AfterUpdate, BeforeUpdate,
    PrimaryGeneratedColumn
} from "typeorm";
import { Router, Request, Response } from 'express';
import { authenticate } from "passport";

import { EMAIL } from "./EMAIL";

@Entity()
export class USER {

    @PrimaryGeneratedColumn()
    id: number;

    @Column() username: string;
    @Column() password: string;
    @Column() firstname: string;
    @Column() lastname: string;


    @OneToMany(type => EMAIL, email => email.user, {
        cascadeUpdate: false,
        cascadeInsert: false
    })
    emails: EMAIL[] = [];

    session_expire_in: number;

}


export default USER;