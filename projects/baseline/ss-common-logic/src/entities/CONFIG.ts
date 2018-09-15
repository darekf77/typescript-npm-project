import { META } from 'morphi';
import * as _ from 'lodash';
import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { Entity, EntityRepository } from 'typeorm';
import { CLASSNAME, FormlyForm, DefaultModelWithMapping } from 'morphi';


export interface ICONFIG {
  id?: number;
  key: string;
  value: any;
}

//#region @backend
@Entity(META.tableNameFrom(CONFIG))
//#endregion
@FormlyForm()
@DefaultModelWithMapping<CONFIG>({
  key: '',
  value: ''
})
@CLASSNAME('CONFIG')
export class CONFIG extends META.BASE_ENTITY<CONFIG, ICONFIG> implements ICONFIG {

  fromRaw(obj: ICONFIG): CONFIG {
    const config = new CONFIG();
    Object.keys(obj).forEach(key => config[key] = obj[key])
    return config;
  }

  @PrimaryGeneratedColumn()
  id: number = undefined

  @Column({ unique: true }) key: string;
  @Column({ nullable: true }) value: string;


}

export interface CONFIG_ALIASES {
  //#region @backend
  config: string;
  configs: string;
  //#endregion
}

@EntityRepository(CONFIG)
export class CONFIG_REPOSITORY extends META.BASE_REPOSITORY<CONFIG, CONFIG_ALIASES> {

  //#region @backend
  globalAliases: (keyof CONFIG_ALIASES)[] = ['config', 'configs'];
  //#endregion

}
