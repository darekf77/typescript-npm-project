import { Morphi } from 'morphi';
import { IPROGRESS_BAR_DATA, ProgressBarStatus, PROGRESS_BAR_DATA as TNP_PROGRESS_BAR_DATA, } from 'tnp-bundle';


export { IPROGRESS_BAR_DATA, PROGRESS_BAR_DATA as TNP_PROGRESS_BAR_DATA, ProgressBarStatus, ProgressBarType } from 'tnp-bundle'




@Morphi.Entity({
  className: 'PROGRESS_BAR_DATA'
})
export class PROGRESS_BAR_DATA extends Morphi.Base.Entity<PROGRESS_BAR_DATA, IPROGRESS_BAR_DATA> implements IPROGRESS_BAR_DATA {

  value: number;
  status: ProgressBarStatus;
  info: string;

  //#region @backend

  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number;


  fromRaw(obj: PROGRESS_BAR_DATA | IPROGRESS_BAR_DATA): PROGRESS_BAR_DATA {
    throw new Error("Method not implemented.");
  }


  public static create(
    value: number = 0,
    status: ProgressBarStatus = 'notstarted',
    info: string = '') {
    const l = new PROGRESS_BAR_DATA();

    l.value = value;
    l.status = status;
    l.info = info;

    return l;
  }


}

