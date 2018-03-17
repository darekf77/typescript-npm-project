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

//#region @backend
import { Router, Request, Response } from 'express';
import { authenticate } from "passport";
//#endregion

import { SESSION } from "./SESSION";
import { EMAIL } from "./EMAIL";
import { EMAIL_TYPE_NAME } from "./EMAIL_TYPE";
import { tableNameFrom, BASE_ENTITY } from '../helpers';



export interface IUSER {
  email?: string;
  username: string;
  password: string;
  firstname?: string;
  lastname?: string;
  city?: string;
}




@Entity(tableNameFrom(USER))
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
      .createQueryBuilder(tableNameFrom(USER))
      .innerJoinAndSelect(`${tableNameFrom(USER)}.emails`, 'emails')
      .where(`${tableNameFrom(USER)}.username = :username`)
      .setParameter('username', username)
      .getOne()
    //#endregion
  }

  byId(id: number, repo: Repository<USER>) {
    //#region @backendFunc
    return this
      .createQueryBuilder(tableNameFrom(USER))
      .innerJoinAndSelect(`${tableNameFrom(USER)}.emails`, 'emails')
      .where(`${tableNameFrom(USER)}.id = :id`)
      .setParameter('id', id)
      .getOne()
    //#endregion
  }

}


export default USER;
