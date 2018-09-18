
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany";
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne";
import { JoinTable } from "typeorm/decorator/relations/JoinTable";
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn";
import { Column } from "typeorm/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { USER } from "./USER";
import { EMAIL_TYPE } from './EMAIL_TYPE';
import { META } from 'morphi';
import { CLASSNAME } from 'morphi';


//#region @backend
import { Entity } from "typeorm/decorator/entity/Entity";

//#endregion


export interface IEMAIL {

}


//#region @backend
@Entity(META.tableNameFrom(EMAIL))
//#endregion
@CLASSNAME('EMAIL')
export class EMAIL extends META.BASE_ENTITY<EMAIL> implements IEMAIL {

  fromRaw(obj: Object): EMAIL {
    throw new Error("Method not implemented.");
  }

  constructor(address: string) {
    super()
    this.address = address;
  }

  @PrimaryGeneratedColumn()
  public id: number = undefined

  @Column('varchar', { length: 100, unique: true })
  address: string = undefined


  @ManyToMany(() => EMAIL_TYPE, type => type.emails, {
    cascade: false
  })
  @JoinTable()
  types: EMAIL_TYPE[];


  @ManyToOne(() => USER, user => user.id, {
    cascade: false
  })
  @JoinColumn()
  user: USER;

}


