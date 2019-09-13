
import { Morphi } from 'morphi';

export interface ISUEPR_ASD {
  id?: number;
  exampleProperty?: string;
}

@Morphi.Entity<SUEPR_ASD>({
  className: 'SUEPR_ASD',
  mapping: {

  }
})
export class SUEPR_ASD extends Morphi.Base.Entity<SUEPR_ASD, ISUEPR_ASD> implements ISUEPR_ASD {

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  exampleProperty: string

}
