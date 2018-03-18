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

import { EMAIL } from "./EMAIL";
import { tableNameFrom, BASE_ENTITY } from '../helpers';

export type EMAIL_TYPE_NAME = 'normal_auth' | 'facebook' | 'google_plus' | 'twitter';

@Entity(tableNameFrom(EMAIL_TYPE))
export class EMAIL_TYPE extends BASE_ENTITY {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  name: EMAIL_TYPE_NAME;

  @ManyToMany(type => EMAIL, email => email.types, {
    cascadeInsert: false,
    cascadeUpdate: false
  })
  emails: EMAIL[] = [];
}

@EntityRepository(EMAIL_TYPE)
export class EMAIL_TYPE_REPOSITORY extends Repository<EMAIL_TYPE> {
  async getBy(name: EMAIL_TYPE_NAME) {
    //#region @backendFunc
    const etype = await this.findOne({
      where: {
        name
      }
    })
    return etype;
    //#endregion
  }
  async init() {
    //#region @backendFunc
    const types = [
      await this.save(this.createFrom('facebook')),
      await this.save(this.createFrom('normal_auth')),
      await this.save(this.createFrom('twitter')),
      await this.save(this.createFrom('google_plus'))
    ];
    return types;
    //#endregion
  }

  createFrom(name: EMAIL_TYPE_NAME): EMAIL_TYPE {
    //#region @backendFunc
    let t = new EMAIL_TYPE();
    t.name = name;
    return t;
    //#endregion
  }
}

export default EMAIL_TYPE;
