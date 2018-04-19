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
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne";
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
import { Router, Request, Response } from "express";
//#endregion

import { USER } from "./USER";
import { EMAIL_TYPE } from './EMAIL_TYPE';
import { META } from '../../helpers';


@Entity(META.tableNameFrom(EMAIL))
export class EMAIL extends META.BASE_ENTITY {

  constructor(address: string) {
    super()
    this.address = address;
  }

  @PrimaryGeneratedColumn()
  public id: number;

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

}

@EntityRepository(EMAIL)
export class EMAIL_REPOSITORY extends META.BASE_REPOSITORY<EMAIL> {


  async getUserBy(address: string) {
    //#region @backendFunc
    const Email = await this.findOne({
      where: {
        address
      }
    });
    if (Email) return Email.user;
    //#endregion
  }

  async findBy(address: string) {
    //#region @backendFunc
    return await this
      .createQueryBuilder(META.tableNameFrom(EMAIL))
      .innerJoinAndSelect(`${META.tableNameFrom(EMAIL)}.user`, 'user')
      .where(`${META.tableNameFrom(EMAIL)}.address = :email`)
      .setParameter('email', address)
      .getOne();
    //#endregion
  }

}


export default EMAIL;
