import { META } from '../helpers';
import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { Entity, EntityRepository, Connection } from 'typeorm';
import {
  CLASSNAME, FormlyForm, DefaultModelWithMapping,
  ENDPOINT, BaseCRUDEntity, OrmConnection
} from 'morphi';


export interface IEXAMPLE_PAGINATION {
  id?: number;
  name: string;
  age: number;
  test: string;
}



//#region @backend
@Entity(META.tableNameFrom(EXAMPLE_PAGINATION))
//#endregion
@FormlyForm((fields) => {

  return fields;
})
@DefaultModelWithMapping<EXAMPLE_PAGINATION>({
  'isAmazing': true,
  'name': '< default name >',
  'age': 23
})
@CLASSNAME('EXAMPLE_PAGINATION')
export class EXAMPLE_PAGINATION
  extends META.BASE_ENTITY<EXAMPLE_PAGINATION, IEXAMPLE_PAGINATION>
  implements IEXAMPLE_PAGINATION {

  fromRaw(obj: IEXAMPLE_PAGINATION): EXAMPLE_PAGINATION {
    let ex = new EXAMPLE_PAGINATION();
    ex.test = obj.test;
    return ex;
  }

  @PrimaryGeneratedColumn()
  id: number = undefined

  @Column() name: string;
  @Column() test: string;

  @Column() age: number;

  @Column('boolean') isAmazing: boolean;

}

export interface EXAMPLE_PAGINATION_ALIASES {
  //#region @backend
  example: string;
  examples: string;
  //#endregion
}

@EntityRepository(EXAMPLE_PAGINATION)
export class EXAMPLE_PAGINATION_REPOSITORY
  extends META.BASE_REPOSITORY<EXAMPLE_PAGINATION, EXAMPLE_PAGINATION_ALIASES> {

  //#region @backend
  globalAliases: (keyof EXAMPLE_PAGINATION_ALIASES)[] = ['example', 'examples'];
  //#endregion

}
