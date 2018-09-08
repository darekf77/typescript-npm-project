import * as _ from 'lodash';
import { META } from "baseline/ss-common-logic/src/helpers";
import { Entity, Column, PrimaryGeneratedColumn, EntityRepository } from "typeorm";
import { FormlyForm, DefaultModelWithMapping, CLASSNAME } from 'morphi';
import { EnumValues } from 'enum-values';

//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import { run, HelpersLinks, killProcess } from 'tnp-bundle';
//#endregion

export enum DOMAIN_ENVIRONMENT {
  DEV = 1,
  STAGE,
  PROD

}


export interface IDOMAIN {
  name: string;

}


//#region @backend
@Entity(META.tableNameFrom(DOMAIN))
//#endregion
@FormlyForm<DOMAIN>()
@DefaultModelWithMapping<DOMAIN>({
  name: '',
  environment: DOMAIN_ENVIRONMENT.PROD
})
@CLASSNAME('DOMAIN')
export class DOMAIN extends META.BASE_ENTITY<DOMAIN> {
  fromRaw(obj: DOMAIN): DOMAIN {
    throw new Error("Method not implemented.");
  }

  @PrimaryGeneratedColumn()
  id: number;

  get path() {
    if (this.environment === DOMAIN_ENVIRONMENT.PROD) {
      return this.name;
    }
    return `${EnumValues.getNameFromValue(DOMAIN_ENVIRONMENT, this.environment)}.${this.name}`;
  }

  @Column({ nullable: true }) name: string;

  @Column({ default: DOMAIN_ENVIRONMENT.PROD }) environment: DOMAIN_ENVIRONMENT;


}

export interface BUILD_ALIASES {
  domain: string;
  domains: string;
}

@EntityRepository(DOMAIN)
export class DOMAIN_REPOSITORY extends META.BASE_REPOSITORY<DOMAIN, BUILD_ALIASES> {
  globalAliases: (keyof BUILD_ALIASES)[] = ['domain', 'domains']

  async getById(id: number) {
    const domain = await this.findOne(id);
    if (!domain) {
      throw `Cannot find domain with id ${id} `
    }
    return domain;
  }

}
