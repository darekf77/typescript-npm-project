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
import { EMAIL_TYPE } from "./EMAIL_TYPE";
import { META } from 'morphi';
import { CLASSNAME } from 'morphi';




export interface IUSER {
  email?: string;
  username: string;
  password: string;
  firstname?: string;
  lastname?: string;
  city?: string;
}

//#region @backend
@Entity(META.tableNameFrom(USER))
//#endregion
@CLASSNAME('USER')
export class USER extends META.BASE_ENTITY<USER, IUSER> implements IUSER {


  fromRaw(obj: IUSER): USER {
    throw new Error("Method not implemented.");
  }

  @PrimaryGeneratedColumn()
  id: number = undefined

  session: SESSION = undefined

  @Column() username: string = undefined
  @Column() password: string = undefined
  @Column({ nullable: true }) whereCreated: 'baseline' | 'site' = 'baseline';
  @Column({ nullable: true }) firstname: string = undefined
  @Column({ nullable: true }) lastname: string = undefined
  @Column({ nullable: true }) email?: string = undefined


  @OneToMany(type => EMAIL, email => email.user, {
    cascade: false
  })
  emails: EMAIL[];

}

export interface USER_ALIASES {
  //#region @backend
  user: string;
  //#endregion
}

@EntityRepository(USER)
export class USER_REPOSITORY extends META.BASE_REPOSITORY<USER, USER_ALIASES> {

  //#region @backend
  globalAliases: (keyof USER_ALIASES)[] = ['user']
  //#endregion

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
