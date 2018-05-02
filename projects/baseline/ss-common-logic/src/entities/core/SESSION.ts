//#region typeorm imports
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
import { EntityRepository } from 'typeorm';
//#endregion

//#region @backend
import { verify, generate } from "password-hash";
//#endregion


import { Log, Level } from "ng2-logger";
import { Resource } from "ng2-rest";
const log = Log.create(__filename);

import { USER } from './USER';
import { META } from '../../helpers';


export const SESSION_CONFIG = {
  SESSION_TIME_SECONDS: 3600,
  SESSION_LOCAL_STORAGE: 'session-isomorphic-rest',
  AUTHORIZATION_HEADER: 'Authorization'
}

export class LocalStorage {
  CONFIG = SESSION_CONFIG;

  saveInLocalStorage(session: SESSION) {
    window.localStorage.setItem(this.CONFIG.SESSION_LOCAL_STORAGE, JSON.stringify(session));
  }

  fromLocalStorage(): SESSION {
    let session: SESSION = new SESSION();
    try {
      const data = window.localStorage.getItem(this.CONFIG.SESSION_LOCAL_STORAGE);
      const s = JSON.parse(data) as SESSION;
      session.token = s.token;
      session.token_type = s.token_type;
      session.expiredDate = new Date(s.expiredDate as any);
    } catch {
      session = undefined;
    }
    return session;
  }

  removeFromLocalStorage() {
    window.localStorage.removeItem(this.CONFIG.SESSION_LOCAL_STORAGE);
  }
}


@Entity(META.tableNameFrom(SESSION))
export class SESSION extends META.BASE_ENTITY<SESSION> {
  
  fromRaw(obj: Object): SESSION {
    throw new Error("Method not implemented.");
  }
  
  CONFIG = SESSION_CONFIG;

  expireInSeconds: number;
  calculateExpirationTime(): number {
    const now = new Date();
    return Math.round((this.expiredDate.getTime() - now.getTime()) / 1000);
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
  createdDate: Date;

  @Column({
    nullable: false
  })
  expiredDate: Date;


  @OneToOne(type => USER, user => user.id, {
    nullable: true
  })
  @JoinColumn()
  user: USER;

  //#region @backend
  public createToken(token?: string) {
    this.createdDate = new Date();
    const timestamp = this.createdDate.getTime();
    this.token = token ? token : generate(this.user.id + timestamp + this.ip)
    this.expiredDate = new Date(timestamp + this.CONFIG.SESSION_TIME_SECONDS * 1000)
  }
  //#endregion

  isExpired(when: Date = new Date()) {
    let time = {
      expire: this.expiredDate.getTime(),
      now: when.getTime()
    }
    return (time.expire < time.now);
  }

  public activateBrowserToken() {
    const session: SESSION = this;
    Resource.Headers.request.set(this.CONFIG.AUTHORIZATION_HEADER,
      `${session.token_type} ${session.token}`)
  }

  public static localStorage = new LocalStorage()

}



@EntityRepository(SESSION)
export class SESSION_REPOSITORY extends META.BASE_REPOSITORY<SESSION> {


  CONFIG = SESSION_CONFIG;

  async getByUser(user: USER, ip: string) {
    //#region @backendFunc
    const Session = await this.createQueryBuilder(META.tableNameFrom(SESSION))
      .innerJoinAndSelect(`${META.tableNameFrom(SESSION)}.user`, META.tableNameFrom(USER))
      .where(`${META.tableNameFrom(SESSION)}.user = :id`)
      .andWhere(`${META.tableNameFrom(SESSION)}.ip = :ip`)
      .setParameters({
        id: user.id,
        ip
      })
      .getOne()
    if (Session) {
      Session.expireInSeconds = Session.calculateExpirationTime();
    }
    return Session;
    //#endregion
  }

  async getByToken(token: string) {
    //#region @backendFunc
    const Session = await this.createQueryBuilder(META.tableNameFrom(SESSION))
      .innerJoinAndSelect(`${META.tableNameFrom(SESSION)}.user`, META.tableNameFrom(USER))
      .where(`${META.tableNameFrom(SESSION)}.token = :token`)
      .setParameter('token', token)
      .getOne();
    if (Session) {
      Session.expireInSeconds = Session.calculateExpirationTime();
    }
    return Session;
    //#endregion
  }

  async getFrom(user: USER, ip: string) {
    //#region @backendFunc

    let Session = this.create();
    Session.user = user;
    Session.ip = ip;

    Session.createToken(user.username == 'postman' ? 'postman' : undefined);

    Session = await this.save(Session);
    if (Session) {
      Session.expireInSeconds = Session.calculateExpirationTime();
    }
    return Session;
    //#endregion
  }


}


export default SESSION;
