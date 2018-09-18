import { OneToMany } from "typeorm/decorator/relations/OneToMany";
import { Column } from "typeorm/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/decorator/entity/Entity";
import { SESSION } from "./SESSION";
import { EMAIL } from "./EMAIL";
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


  @OneToMany(() => EMAIL, email => email.user, {
    cascade: false
  })
  emails: EMAIL[];

}
