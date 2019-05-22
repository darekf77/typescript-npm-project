
import { Morphi } from 'morphi';

export interface IRS_CORE_AUTH {
  id?: number;
  exampleProperty?: string;
}

@Morphi.Entity<RS_CORE_AUTH>({
  className: 'RS_CORE_AUTH',
  mapping: {

  }
})
export class RS_CORE_AUTH extends Morphi.Base.Entity<RS_CORE_AUTH, IRS_CORE_AUTH> implements IRS_CORE_AUTH {

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  exampleProperty: string

}
