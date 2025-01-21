import { Taon } from 'taon/src';

export type TaonEnvType = 'dev' | 'prod' | 'test' | 'stage';

@Taon.Entity({
  className: 'TaonEnv',
})
export class TaonEnv extends Taon.Base.AbstractEntity {
  static from(obj: { name: string; type: TaonEnvType }) {
    return new TaonEnv().clone(obj);
  }

  //#region fields / type
  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  type: TaonEnvType;
  //#endregion

  //#region fields / name
  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  name: string;
  //#endregion
}
