
import * as _ from 'lodash';
import { Entity, Column, PrimaryGeneratedColumn, EntityRepository } from "typeorm";
import { Morphi } from 'morphi';
import { EnumValues } from 'enum-values';


export interface ISYSTEM_INFO {
  name: string;
  value: string;
}


@Morphi.Entity<SYSTEM_INFO>({
  className: 'SYSTEM_INFO',
  defaultModelValues: {
    name: '',
    value: ''
  }
})
export class SYSTEM_INFO extends Morphi.Base.Entity<SYSTEM_INFO> implements ISYSTEM_INFO {


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
  value: string;



}
