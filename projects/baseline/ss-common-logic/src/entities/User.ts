//#region typeorm imports
import { Connection } from "typeorm/connection/Connection";
import { Repository } from "typeorm/repository/Repository";
import { AfterInsert } from "typeorm/decorator/listeners/AfterInsert";
import { AfterUpdate } from "typeorm/decorator/listeners/AfterUpdate";
import { BeforeUpdate } from "typeorm/decorator/listeners/BeforeUpdate";
import { OneToMany } from "typeorm/decorator/relations/OneToMany";
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany";
import { JoinTable } from "typeorm/decorator/relations/JoinTable";
import { Column } from "typeorm/decorator/columns/Column";
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/decorator/entity/Entity";
import { EntityRepository } from 'typeorm/decorator/EntityRepository';
import { getCustomRepository } from 'typeorm';
//#endregion

//#region @backend
import { Router, Request, Response } from 'express';
import { authenticate } from "passport";
//#endregion

import { SESSION } from "./SESSION";
import { EMAIL } from "./EMAIL";
import { EMAIL_TYPE_NAME } from "./EMAIL_TYPE";
import { BASE_ENTITY, META } from '../helpers';


export interface IUSER {
  email?: string;
  username: string;
  password: string;
  firstname?: string;
  lastname?: string;
  city?: string;
}


@Entity(META.tableNameFrom(USER))
export class USER extends BASE_ENTITY implements IUSER {

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

}


@EntityRepository(USER)
export class USER_REPOSITORY extends Repository<USER> {

  byUsername(username: string) {
    //#region @backendFunc
    return this
      .createQueryBuilder(META.tableNameFrom(USER))
      .innerJoinAndSelect(`${META.tableNameFrom(USER)}.emails`, 'emails')
      .where(`${META.tableNameFrom(USER)}.username = :username`)
      .setParameter('username', username)
      .getOne()
    //#endregion
  }

  byId(id: number) {
    //#region @backendFunc
    return this
      .createQueryBuilder(META.tableNameFrom(USER))
      .innerJoinAndSelect(`${META.tableNameFrom(USER)}.emails`, 'emails')
      .where(`${META.tableNameFrom(USER)}.id = :id`)
      .setParameter('id', id)
      .getOne()
    //#endregion
  }

}

export const USER_META = function (connection: Connection) {
  return META.get<USER, USER_REPOSITORY>(connection, USER, USER_REPOSITORY)
}

export default USER;
