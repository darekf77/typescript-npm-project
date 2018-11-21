import * as _ from 'lodash';
import { Entity, Column, PrimaryGeneratedColumn, EntityRepository } from "typeorm";
import { FormlyForm, DefaultModelWithMapping, CLASSNAME, META } from 'morphi';
import { EnumValues } from 'enum-values';

//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import { run, HelpersLinks, killProcess } from 'tnp-bundle';

//#endregion




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


//#region @backend
@Entity(META.tableNameFrom(DOMAIN))
//#endregion
@FormlyForm<DOMAIN>()
@DefaultModelWithMapping<DOMAIN>({
  name: '',
  target: '',
  production: false
})
@CLASSNAME('DOMAIN')
export class DOMAIN extends META.BASE_ENTITY<DOMAIN> implements IDOMAIN {
  fromRaw(obj: DOMAIN): DOMAIN {
    throw new Error("Method not implemented.");
  }

  @PrimaryGeneratedColumn()
  id: number;


  @Column({ nullable: true }) name: string;

  @Column({ nullable: true }) target: string;

  @Column({ nullable: true }) production: boolean;


}
