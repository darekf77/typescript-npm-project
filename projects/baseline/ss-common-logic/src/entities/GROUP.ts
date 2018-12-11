import { Morphi } from 'morphi';
import { DIALOG, IDIALOG } from './DIALOG';
import { MULTIMEDIA } from './core/MULTIMEDIA';
import { CATEGORY } from './CATEGORY';

export interface IGROUP {
  id?: number;
  title: string;
  dialogs: IDIALOG[];
  picture?: MULTIMEDIA;
}


@Morphi.Entity<GROUP>({
  className: 'GROUP',
  formly: {
    exclude: ['id']
  },
  defaultModelValues: {
    title: ''
  },
  mapping: {
    picture: 'MULTIMEDIA'
  }
})
export class GROUP extends Morphi.Base.Entity<GROUP, IGROUP> implements IGROUP {


  fromRaw(obj: IGROUP): GROUP {
    let group = new GROUP()
    group.id = obj.id;
    group.title = obj.title;
    group.dialogs = obj.dialogs.map(d => {
      let dialog = new DIALOG();
      dialog = dialog.fromRaw(d);
      dialog.group = group;
      return dialog;
    })
    return group;
  }

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number = undefined

  //#region @backend

  @Morphi.Orm.Column.Custom()
  //#endregion
  title: string = undefined

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  amazing: string = ' asdmasdas'


  //#region @backend
  @Morphi.Orm.Relation.ManyToOne(() => CATEGORY, cat => cat.id, {
    cascade: false
  })
  //#endregion
  category: CATEGORY;


  //#region @backend
  @Morphi.Orm.Relation.OneToMany(() => DIALOG, dial => dial.group, {
    cascade: false
  })
  //#endregion
  dialogs: DIALOG[];


  //#region @backend
  @Morphi.Orm.Relation.ManyToOne(() => MULTIMEDIA, m => m.id, {
    cascade: false
  })
  //#endregion
  picture?: MULTIMEDIA;

}
