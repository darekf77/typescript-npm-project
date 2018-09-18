import { ManyToMany } from "typeorm/decorator/relations/ManyToMany";
import { Column } from "typeorm/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/decorator/entity/Entity";
import { EMAIL } from "./EMAIL";
import { META } from 'morphi';
import { CLASSNAME } from 'morphi';





export type EMAIL_TYPE_NAME = 'normal_auth' | 'facebook' | 'google_plus' | 'twitter';

export interface IEMAIL_TYPE {

}


//#region @backend
@Entity(META.tableNameFrom(EMAIL_TYPE))
//#endregion
@CLASSNAME('EMAIL_TYPE')
export class EMAIL_TYPE extends META.BASE_ENTITY<EMAIL_TYPE> implements IEMAIL_TYPE {

  fromRaw(obj: Object): EMAIL_TYPE {
    throw new Error("Method not implemented.");
  }

  @PrimaryGeneratedColumn()
  id: number = undefined

  @Column({ length: 50, unique: true })
  name: EMAIL_TYPE_NAME = undefined


  @ManyToMany(() => EMAIL, email => email.types, {
    cascade: false
  })
  emails: EMAIL[];
}


