import { Morphi } from 'morphi';
import * as _ from 'lodash';



export interface ICONFIG {
  id?: number;
  key: string;
  value: any;
}


@Morphi.Entity<CONFIG>({
  className: 'CONFIG',
  defaultModelValues: {
    key: '',
    value: ''
  }
})
export class CONFIG extends Morphi.Base.Entity<CONFIG, ICONFIG> implements ICONFIG {

  fromRaw(obj: ICONFIG): CONFIG {
    const config = new CONFIG();
    Object.keys(obj).forEach(key => config[key] = obj[key])
    return config;
  }

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number = undefined

  //#region @backend
  @Morphi.Orm.Column.Custom({ unique: true })
  //#endregion
  key: string;

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  value: string;


}

