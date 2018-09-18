import { Entity, EntityRepository, OneToOne, OneToMany, ManyToOne } from 'typeorm';
import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { CLASSNAME, FormlyForm, DefaultModelWithMapping } from 'morphi';
import { META } from 'morphi';
import { MULTIMEDIA } from './core/MULTIMEDIA';




export interface IEXAMPLE {
  id?: number;
  test: string;
}

@DefaultModelWithMapping<AnotherJSON>(
  {
    isGood: true,
    speed: 33
  })
export class AnotherJSON {
  isGood: Boolean;
  speed: Number;
}

@DefaultModelWithMapping<TestJSON>(
  {
    name: 'test',
    age: 23,
    isAwesome: true
  },
  {
    test: AnotherJSON
  })
export class TestJSON {
  name: string;
  age: number;
  isAwesome: Boolean;
  test: AnotherJSON;
}


//#region @backend
@Entity(META.tableNameFrom(EXAMPLE))
//#endregion
@FormlyForm((fields) => {

  return fields;
})
@DefaultModelWithMapping<EXAMPLE>({
  'isAmazing': true,
  'href': '< http://defaulthref >',
  'name': '< default name >',
  'age': 23,
  'birthDate': new Date('01-02-2000')
}, {
    testjson: 'TestJSON'
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


  @ManyToOne(type => MULTIMEDIA, multimedia => multimedia.id, {
    nullable: true,
    cascade: false
  })
  multimediaExample?: MULTIMEDIA;

  @Column() age: number;

  @Column() birthDate: Date;


  @Column('boolean') isAmazing;

  @Column() otherData: string = 'asdasdasd';
}
