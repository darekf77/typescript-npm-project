import { META } from '../helpers';
import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { Entity, EntityRepository } from 'typeorm';
import { CLASSNAME, FormlyForm, ModelMapping, DefaultModel } from 'morphi';

export interface IEXAMPLE {
  id?: number;
  test: string;
}

export class TestJSON {
  name = 'super!';
  age = 23;
  isAwesome = true;
}


//#region @backend
@Entity(META.tableNameFrom(EXAMPLE))
//#endregion
@FormlyForm((fields) => {
  console.log(fields)
  return fields;
})
@DefaultModel<EXAMPLE>({
  'isAmazing': true,
  'href': '< http://defaulthref >',
  'name': '< default name >',
  'age': 23,
  'birthDate': new Date('01-02-2000')
})
@ModelMapping<EXAMPLE>({
  testjson: TestJSON
})
@CLASSNAME('EXAMPLE')
export class EXAMPLE extends META.BASE_ENTITY<EXAMPLE, IEXAMPLE> implements IEXAMPLE {

  fromRaw(obj: IEXAMPLE): EXAMPLE {
    let ex = new EXAMPLE();
    ex.test = obj.test;
    return ex;
  }



  @PrimaryGeneratedColumn()
  id: number = undefined

  @Column('simple-json') testjson = new TestJSON();

  @Column() test: string = undefined;
  @Column() href: string;
  @Column() name: string;

  @Column() age: number;

  @Column() birthDate: Date;


  @Column('boolean') isAmazing;

  @Column() otherData: string = 'asdasdasd';
}

export interface EXAMPLE_ALIASES {
  //#region @backend
  example: string;
  examples: string;
  //#endregion
}


@EntityRepository(EXAMPLE)
export class EXAMPLE_REPOSITORY extends META.BASE_REPOSITORY<EXAMPLE, EXAMPLE_ALIASES> {

  //#region @backend
  globalAliases: (keyof EXAMPLE_ALIASES)[] = ['example', 'examples'];
  //#endregion

}
