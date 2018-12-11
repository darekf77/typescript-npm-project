import { Morphi } from 'morphi';



export interface IEXAMPLE_PAGINATION {
  id?: number;
  name: string;
  age: number;
  test: string;
}


@Morphi.Entity<EXAMPLE_PAGINATION>({
  className: 'EXAMPLE_PAGINATION',
  formly: {
    transformFn: (fields) => {

      return fields;
    }
  },
  defaultModelValues: {
    'isAmazing': true,
    'name': '< default name >',
    'age': 23
  }
})
export class EXAMPLE_PAGINATION
  extends Morphi.Base.Entity<EXAMPLE_PAGINATION, IEXAMPLE_PAGINATION>
  implements IEXAMPLE_PAGINATION {

  fromRaw(obj: IEXAMPLE_PAGINATION): EXAMPLE_PAGINATION {
    let ex = new EXAMPLE_PAGINATION();
    ex.test = obj.test;
    return ex;
  }

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number = undefined

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  name: string;

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  test: string;

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  age: number;

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  price: number = 23

  //#region @backend
  @Morphi.Orm.Column.Custom('boolean')
  //#endregion
  isAmazing: boolean;

}
