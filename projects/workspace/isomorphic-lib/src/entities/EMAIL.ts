import {
    Entity, PrimaryColumn, Column,
    Connection, OneToMany, ManyToOne,
    JoinColumn, ManyToMany, JoinTable,
    PrimaryGeneratedColumn, Repository
} from "typeorm";
import { Router, Request, Response } from "express";

import { USER } from "./USER";
import { EMAIL_TYPE } from './EMAIL_TYPE';

import { __ } from '../helpers';

@Entity(__(EMAIL))
export class EMAIL {

    constructor(address: string) {
        this.address = address;
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 100, unique: true })
    address: string;


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


    public static async getUser(address: string, repo: Repository<EMAIL>) {
        const Email = await repo.findOne({
            where: {
                address
            }
        });
        if (Email) return Email.user;
    }

}

export default EMAIL;