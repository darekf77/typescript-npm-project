import { Morphi } from 'morphi';
import { SESSION } from "./SESSION";
import { EMAIL } from "./EMAIL";


export interface IUSER {
  email?: string;
  username: string;
  password: string;
  firstname?: string;
  lastname?: string;
  city?: string;
}

@Morphi.Entity({
  className: 'USER'
})
export class USER extends Morphi.Base.Entity<USER, IUSER> implements IUSER {


  fromRaw(obj: IUSER): USER {
    throw new Error("Method not implemented.");
  }

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number

  session: SESSION

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  username: string

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  password: string

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  whereCreated: 'baseline' | 'site' = 'baseline';

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  firstname: string

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  lastname: string

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  email?: string

  //#region @backend
  @Morphi.Orm.Relation.OneToMany(() => EMAIL, email => email.user, {
    cascade: false
  })
  //#endregion
  emails: EMAIL[];

}
