import {
    Entity, PrimaryColumn, Column, Connection, AfterInsert, PrimaryGeneratedColumn,
    CreateDateColumn, OneToOne, Repository, JoinColumn, BeforeInsert,
} from "typeorm";
import { verify, generate } from "password-hash";
// local
import USER from './USER';

/**
 * Session time in miliseconds
 */
const SESSION_TIME = 3600 * 1000; // 1h

@Entity()
export class SESSION {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    token: string;

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
        let timestamp = new Date().getTime();
        this.token = token ? token : generate(this.user.id + timestamp + this.ip)
        this.expired_date = new Date(timestamp + SESSION_TIME)
    }
}


export default SESSION;