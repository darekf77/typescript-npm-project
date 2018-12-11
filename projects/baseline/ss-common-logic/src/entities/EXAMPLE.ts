import { Morphi } from 'morphi';
import { MULTIMEDIA } from './core/MULTIMEDIA';


export interface IEXAMPLE {
  id?: number;
  test: string;
}

@Morphi.Entity<AnotherJSON>({
  className: 'AnotherJSON',
  defaultModelValues: {
    isGood: true,
    speed: 33
  }
})
export class AnotherJSON {
  isGood: Boolean;
  speed: Number;
}


@Morphi.Entity<TestJSON>({
  className: 'TestJSON',
  defaultModelValues: {
    name: 'test',
    age: 23,
    isAwesome: true
  },
  mapping: {
    test: AnotherJSON
  }
})
export class TestJSON {
  name: string;
  age: number;
  isAwesome: Boolean;
  test: AnotherJSON;
}



@Morphi.Entity({
  className: 'EXAMPLE',
  formly: {
    transformFn: (fields) => {
      return fields;
    }
  },
  defaultModelValues: {
    'isAmazing': true,
    'href': '< http://defaulthref >',
    'name': '< default name >',
    'age': 23,
    'birthDate': new Date('01-02-2000')
  },
  mapping: {
    testjson: 'TestJSON'
  }
})
export class EXAMPLE extends Morphi.Base.Entity<EXAMPLE, IEXAMPLE> implements IEXAMPLE {

  fromRaw(obj: IEXAMPLE): EXAMPLE {
    let ex = new EXAMPLE();
    ex.test = obj.test;
    return ex;
  }


  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number = undefined

  //#region @backend
  @Morphi.Orm.Column.Custom('simple-json')
  //#endregion

  testjson = new TestJSON();

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  test: string = undefined;

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  href: string;

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  name: string;


  //#region @backend
  @Morphi.Orm.Relation.ManyToOne(type => MULTIMEDIA, multimedia => multimedia.id, {
    nullable: true,
    cascade: false
  })
  //#endregion
  multimediaExample?: MULTIMEDIA;

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  age: number;

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  birthDate: Date;


  //#region @backend
  @Morphi.Orm.Column.Custom('boolean')
  //#endregion
  isAmazing: boolean;


  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  otherData: string = 'asdasdasd';
}
