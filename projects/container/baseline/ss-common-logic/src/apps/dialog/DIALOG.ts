import { Morphi } from 'morphi';
import { EnumValues } from 'enum-values';
import { MULTIMEDIA } from '../multimedia/MULTIMEDIA';
import { GROUP } from '../group/GROUP';

console.log('asd aa')
export enum DialogType {
  MAN,
  WOMAN,
  HINT
}

export interface IDIALOG {
  id?: number;
  type?: DialogType;
  lang_pl?: string;
  lang_en?: string;
  lang_fr?: string;

  audio_pl?: MULTIMEDIA;
  audio_en?: MULTIMEDIA;
  audio_fr?: MULTIMEDIA;

}


@Morphi.Entity<DIALOG>({
  className: 'DIALOG',
  defaultModelValues: {
    type: DialogType.HINT,
    lang_en: '',
    lang_fr: '',
    lang_pl: ''
  },
  mapping: {
    group: 'GROUP',
    audio_en: 'MULTIMEDIA',
    audio_fr: 'MULTIMEDIA',
    audio_pl: 'MULTIMEDIA'
  }
})
export class DIALOG extends Morphi.Base.Entity<DIALOG, IDIALOG> implements IDIALOG {

  fromRaw(obj: IDIALOG): DIALOG {
    let dialog = new DIALOG();
    dialog.lang_en = obj.lang_en;
    dialog.lang_fr = obj.lang_fr;
    dialog.lang_pl = obj.lang_pl;
    dialog.type = obj.type;
    return dialog;
  }


  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number = undefined

  //#region @backend
  @Morphi.Orm.Column.Custom({ default: DialogType.HINT })
  //#endregion
  type: DialogType;

  get typeString() {
    return EnumValues.getNameFromValue(DialogType, this.type)
  }


  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  lang_pl?: string = undefined

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  lang_en?: string = undefined

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  lang_fr?: string = undefined


  //#region @backend
  @Morphi.Orm.Relation.ManyToOne(type => GROUP, group => group.id, {
    cascade: false
  })
  //#endregion
  group: GROUP;

  //#region @backend
  @Morphi.Orm.Relation.ManyToOne(type => MULTIMEDIA, m => m.id, {
    cascade: false
  })
  //#endregion
  audio_pl?: MULTIMEDIA;

  //#region @backend
  @Morphi.Orm.Relation.ManyToOne(type => MULTIMEDIA, m => m.id, {
    cascade: false
  })
  //#endregion
  audio_en?: MULTIMEDIA;

  //#region @backend
  @Morphi.Orm.Relation.ManyToOne(type => MULTIMEDIA, m => m.id, {
    cascade: false
  })
  //#endregion
  audio_fr?: MULTIMEDIA;


}

