import {
    Entity, PrimaryColumn, Column,
    Connection, OneToMany, ManyToMany, JoinTable,
    AfterInsert, AfterUpdate, BeforeUpdate,
    PrimaryGeneratedColumn, Repository
} from "typeorm";
import { Router, Request, Response } from 'express';
import { authenticate } from "passport";

import { SESSION } from "./SESSION";
import { EMAIL } from "./EMAIL";
import { EMAIL_TYPE_NAME } from "./EMAIL_TYPE";
import { __ } from '../helpers';

export interface IUSER {
    email?: string;
    username: string;
    password: string;
    firstname?: string;
    lastname?: string;
    city?: string;
}


@Entity(__(USER))
export class USER implements IUSER {

    @PrimaryGeneratedColumn()
    id: number;

    session: SESSION;
    
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

    public static async byUsername(username: string, repo: Repository<USER>) {
        const User = await repo
            .createQueryBuilder(__(USER))
            .innerJoinAndSelect(`${__(USER)}.emails`, 'emails')
            .where(`${__(USER)}.username = :username`)
            .setParameter('username', username)
            .getOne()
        return User;
    }

    public static async byId(id: number, repo: Repository<USER>) {
        const User = await repo
            .createQueryBuilder(__(USER))
            .innerJoinAndSelect(`${__(USER)}.emails`, 'emails')
            .where(`${__(USER)}.id = :id`)
            .setParameter('id', id)
            .getOne()
        return User;
    }
}


export default USER;