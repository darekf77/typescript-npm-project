import { META } from '../helpers';
import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { ManyToOne } from 'typeorm/decorator/relations/ManyToOne';
import { CATEGORY } from './CATEGORY';
import { JoinColumn } from 'typeorm/decorator/relations/JoinColumn';
import { Entity, EntityRepository } from 'typeorm';
import { CategoryController } from '../controllers';
import { GROUP } from './GROUP';
import { CLASSNAME, FormlyForm, DefaultModelWithMapping } from 'morphi';
import { EnumValues } from 'enum-values';

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
  comment?: string;

}

//#region @backend
@Entity(META.tableNameFrom(DIALOG))
//#endregion
@FormlyForm()
@DefaultModelWithMapping<DIALOG>({
  type: DialogType.HINT,
  comment: '',
  lang_en: '',
  lang_fr: '',
  lang_pl: ''
}, {
    group: GROUP
  })
@CLASSNAME('DIALOG')
export class DIALOG extends META.BASE_ENTITY<DIALOG, IDIALOG> implements IDIALOG {

  fromRaw(obj: IDIALOG): DIALOG {
    let dialog = new DIALOG();
    dialog.comment = obj.comment;
    dialog.lang_en = obj.lang_en;
    dialog.lang_fr = obj.lang_fr;
    dialog.lang_pl = obj.lang_pl;
    dialog.type = obj.type;
    return dialog;
  }

  @PrimaryGeneratedColumn()
  id: number = undefined

  @Column({ default: DialogType.HINT }) type: DialogType;

  get typeString() {
    return EnumValues.getNameFromValue(DialogType, this.type)
  }

  @Column({ nullable: true }) lang_pl?: string = undefined
  @Column({ nullable: true }) lang_en?: string = undefined
  @Column({ nullable: true }) lang_fr?: string = undefined

  @Column({
    nullable: true
  }) comment: string = undefined


  @ManyToOne(type => GROUP, group => group.id, {
    cascadeAll: false
  })
  group: GROUP = undefined


}

export interface DIALOG_ALIASES {
  //#region @backend
  dialog: string;
  dialogs: string;
  //#endregion
}

@EntityRepository(DIALOG)
export class DIALOG_REPOSITORY extends META.BASE_REPOSITORY<DIALOG, DIALOG_ALIASES> {

  //#region @backend
  globalAliases: (keyof DIALOG_ALIASES)[] = ['dialog', 'dialogs'];
  //#endregion

}
