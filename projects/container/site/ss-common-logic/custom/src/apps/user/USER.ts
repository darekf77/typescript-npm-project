
import { Column, Entity } from 'typeorm';
import { Morphi } from 'morphi';

import {
  USER as BASELINE_USER
} from 'baseline/ss-common-logic/src/apps/user/USER';

export * from 'baseline/ss-common-logic/src/apps/user/USER';


@Morphi.Entity({
  className: 'USER'
})
export class USER extends BASELINE_USER {

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  whereCreated: 'baseline' | 'site' = 'site';

}
