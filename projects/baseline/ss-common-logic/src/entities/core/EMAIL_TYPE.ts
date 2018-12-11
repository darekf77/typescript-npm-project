import { Morphi } from 'morphi';
import { EMAIL } from "./EMAIL";





export type EMAIL_TYPE_NAME = 'normal_auth' | 'facebook' | 'google_plus' | 'twitter';

export interface IEMAIL_TYPE {

}


@Morphi.Entity({
  className: 'EMAIL_TYPE'
})
export class EMAIL_TYPE extends Morphi.Base.Entity<EMAIL_TYPE> implements IEMAIL_TYPE {

  fromRaw(obj: Object): EMAIL_TYPE {
    throw new Error("Method not implemented.");
  }

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number = undefined


  //#region @backend
  @Morphi.Orm.Column.Custom({ length: 50, unique: true })
  //#endregion
  name: EMAIL_TYPE_NAME = undefined

  //#region @backend
  @Morphi.Orm.Relation.ManyToMany(() => EMAIL, email => email.types, {
    cascade: false
  })
  //#endregion
  emails: EMAIL[];
}


