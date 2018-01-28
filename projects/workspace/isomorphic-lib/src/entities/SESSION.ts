import { Connection } from "typeorm/connection/Connection";
import { Repository } from "typeorm/repository/Repository";
import { AfterInsert } from "typeorm/decorator/listeners/AfterInsert";
import { AfterUpdate } from "typeorm/decorator/listeners/AfterUpdate";
import { BeforeUpdate } from "typeorm/decorator/listeners/BeforeUpdate";
import { BeforeInsert } from "typeorm/decorator/listeners/BeforeInsert";
import { OneToMany } from "typeorm/decorator/relations/OneToMany";
import { OneToOne } from "typeorm/decorator/relations/OneToOne";
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany";
import { JoinTable } from "typeorm/decorator/relations/JoinTable";
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn";
import { Column } from "typeorm/decorator/columns/Column";
import { CreateDateColumn } from "typeorm/decorator/columns/CreateDateColumn";
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/decorator/entity/Entity";

//#region backend
import { verify, generate } from "password-hash";
//#endregion

// local
import { Log, Level } from "ng2-logger";
const log = Log.create(__filename);

import { USER } from './USER';
import { __ } from '../helpers';

/**
 * Session time in miliseconds
 */
const SESSION_TIME_SECONDS = 10;


function clean(session: SESSION) {
    session.user = undefined;
    return session;
}


@Entity(__(SESSION))
export class SESSION {

    private constructor() {

    }

    exp: number;
    calculateExpirationTime(): number {
        const now = new Date();
        return Math.round((this.expired_date.getTime() - now.getTime()) / 1000);
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    token: string;
    token_type = 'bearer';

    @Column({
        length: 50,
        nullable: true
    })
    ip: string;

    @CreateDateColumn()
    created: Date;

    @Column({
        nullable: false
    })
    expired_date: Date;

    @OneToOne(type => USER, user => user.id, {
        nullable: true
    })
    @JoinColumn()
    user: USER;

    createToken(token?: string) {
        this.created = new Date();
        const timestamp = this.created.getTime();
        this.token = token ? token : generate(this.user.id + timestamp + this.ip)
        this.expired_date = new Date(timestamp + SESSION_TIME_SECONDS * 1000)
    }

    expired(when: Date = new Date()) {
        let time = {
            expire: this.expired_date.getTime(),
            now: when.getTime()
        }
        return (time.expire < time.now);
    }



    public static async getByUser(user: USER, ip: string, repo: Repository<SESSION>) {
        //#region backend
        const Session = await repo.createQueryBuilder(__(SESSION))
            .innerJoinAndSelect(`${__(SESSION)}.user`, __(USER))
            .where(`${__(SESSION)}.user = :id`)
            .andWhere(`${__(SESSION)}.ip = :ip`)
            .setParameters({
                id: user.id,
                ip
            })
            .getOne()
        if (Session) {
            Session.exp = Session.calculateExpirationTime();
        }
        return Session;
        //#endregion
    }
    public static async getByToken(token: string, repo: Repository<SESSION>) {
        //#region backend
        const Session = await repo.createQueryBuilder(__(SESSION))
            .innerJoinAndSelect(`${__(SESSION)}.user`, __(USER))
            .where(`${__(SESSION)}.token = :token`)
            .setParameter('token', token)
            .getOne();
        if (Session) {
            Session.exp = Session.calculateExpirationTime();
        }
        return Session;
        //#endregion
    }

    public static async create(user: USER, ip: string, repo: Repository<SESSION>) {
        //#region backend
        let Session = new SESSION();
        Session.user = user;
        Session.ip = ip;

        Session.createToken(user.username == 'postman' ? 'postman' : undefined);

        Session = await repo.save(Session);
        if (Session) {
            Session.exp = Session.calculateExpirationTime();
        }
        return Session;
        //#endregion
    }

}


export default SESSION;
