

import {
    Entity, PrimaryColumn, Column, Connection,
    ManyToOne, ManyToMany, PrimaryGeneratedColumn
} from "typeorm";
import { Router, Request, Response } from "express";
import EMAIL from "./EMAIL";

export type EMAIL_TYPE_NAME = 'normal_auth' | 'facebook' | 'google_plus' | 'twitter';


@Entity()
export  class EMAIL_TYPE {
    private constructor() {

    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 50, unique: true })
    name: EMAIL_TYPE_NAME;

    @ManyToMany(type => EMAIL, email => email.types, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    emails: EMAIL[] = [];

    public static types = {
        facebook: EMAIL_TYPE.create('facebook'),
        normal_auth: EMAIL_TYPE.create('normal_auth'),
        google_plus: EMAIL_TYPE.create('google_plus'),
        twitter: EMAIL_TYPE.create('twitter'),
    }

    private static create(name: EMAIL_TYPE_NAME): EMAIL_TYPE {
        let t = new EMAIL_TYPE();
        t.name = name;
        return t;
    }

}

export default EMAIL_TYPE;