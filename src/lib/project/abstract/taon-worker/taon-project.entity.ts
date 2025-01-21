import { Taon } from 'taon/src';
import { _, CoreModels } from 'tnp-core/src';

//#region port entity
@Taon.Entity({
  className: 'TaonProject',
  uniqueKeyProp: 'location',
})
export class TaonProject extends Taon.Base.Entity {
  static from(opt: Omit<TaonProject, 'id' | 'version' | '_' | 'clone'>) {
    return _.merge(new TaonProject(), opt);
  }

  //#region port entity / columns /  serviceId
  //#region @websql
  @Taon.Orm.Column.Primary({
    type: 'varchar',
    length: 150,
    unique: true,
  })
  //#endregion
  location: string;
  //#endregion

  //#region port entity / columns /  type
  //#region @websql
  @Taon.Orm.Column.Custom({
    type: 'varchar',
    length: 20,
  })
  //#endregion
  type: CoreModels.LibType;
  //#endregion

  //#region port entity / columns /  type
  //#region @websql
  @Taon.Orm.Column.Boolean(false)
  //#endregion
  isTemporary: boolean;
  //#endregion
}
//#endregion
