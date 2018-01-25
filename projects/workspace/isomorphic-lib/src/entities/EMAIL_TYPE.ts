

import {
    Entity, PrimaryColumn, Column, Connection, JoinTable,
    ManyToOne, ManyToMany, PrimaryGeneratedColumn, Repository
} from "typeorm";
import { Router, Request, Response } from "express";
import { EMAIL } from "./EMAIL";
import { __ } from '../helpers';

export type EMAIL_TYPE_NAME = 'normal_auth' | 'facebook' | 'google_plus' | 'twitter';


@Entity(__(EMAIL_TYPE))
export class EMAIL_TYPE {

    private constructor() {

    }

    @PrimaryGeneratedColumn()
    id: number;


    @Column({ length: 50, unique: true })
    name: EMAIL_TYPE_NAME;


    @ManyToMany(type => EMAIL, email => email.types, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    emails: EMAIL[] = [];

    public static async getBy(name: EMAIL_TYPE_NAME, repo: Repository<EMAIL_TYPE>) {
        const etype = await repo.findOne({
            where: {
                name
            }
        })
        return etype;
    }

    public static async init(repo: Repository<EMAIL_TYPE>) {
        const types = [
            await repo.save(EMAIL_TYPE.create('facebook')),
            await repo.save(EMAIL_TYPE.create('normal_auth')),
            await repo.save(EMAIL_TYPE.create('twitter')),
            await repo.save(EMAIL_TYPE.create('google_plus'))
        ];
        return types;
    }


    private static create(name: EMAIL_TYPE_NAME): EMAIL_TYPE {
        let t = new EMAIL_TYPE();
        t.name = name;
        return t;
    }

}

export default EMAIL_TYPE;