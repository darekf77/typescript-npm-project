import * as _ from 'lodash';
import { Entity, Column, PrimaryGeneratedColumn, EntityRepository } from "typeorm";
import { Morphi } from 'morphi';
import { EnumValues } from 'enum-values';


export interface IDOMAIN {

  /**
   * Domain name
   * Example: mydomain.com
   */
  name: string;

  /**
   * Traget address
   * Example: http://87.34.22.123:5012
   */
  target: string;

  production: boolean;
}


@Morphi.Entity({
  className: 'DOMAIN',
  defaultModelValues: {
    name: '',
    target: '',
    production: false
  }
})
export class DOMAIN extends Morphi.Base.Entity<DOMAIN> implements IDOMAIN {
  fromRaw(obj: DOMAIN): DOMAIN {
    throw new Error("Method not implemented.");
  }

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number;

//#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  name: string;

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  target: string;

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  production: boolean;


}
