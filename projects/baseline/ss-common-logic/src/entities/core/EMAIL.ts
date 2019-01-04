
import { Morphi } from 'morphi';
import { USER } from "./USER";
import { EMAIL_TYPE } from './EMAIL_TYPE';

export interface IEMAIL {

}


@Morphi.Entity<EMAIL>({
  className: 'EMAIL',
  mapping: {
    types: ['EMAIL_TYPE'],
    user: 'USER'
  }
})
export class EMAIL extends Morphi.Base.Entity<EMAIL> implements IEMAIL {

  fromRaw(obj: Object): EMAIL {
    throw new Error("Method not implemented.");
  }

  constructor(address: string) {
    super()
    this.address = address;
  }

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  public id: number = undefined

  //#region @backend
  @Morphi.Orm.Column.Custom('varchar', { length: 100, unique: true })
  //#endregion
  address: string = undefined


  //#region @backend
  @Morphi.Orm.Relation.ManyToMany(() => EMAIL_TYPE, type => type.emails, {
    cascade: false
  })
  @Morphi.Orm.Join.Table()
  //#endregion
  types: EMAIL_TYPE[];

  //#region @backend

  @Morphi.Orm.Relation.ManyToOne(() => USER, user => user.id, {
    cascade: false
  })
  @Morphi.Orm.Join.Column()
  //#endregion
  user: USER;

}


