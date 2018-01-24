import {
    Entity, PrimaryColumn, Column,
    Connection, OneToMany, ManyToMany, JoinTable,
    AfterInsert, AfterUpdate, BeforeUpdate,
    PrimaryGeneratedColumn, Repository
} from "typeorm";
import { Router, Request, Response } from 'express';
import { authenticate } from "passport";

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

    public static async findBy(username: string, repo: Repository<USER>) {
        const User = repo.findOne({
            where: {
                username
            }
        })
        return User;
    }

}


export default USER;