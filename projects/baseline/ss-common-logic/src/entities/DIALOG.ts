import { META } from 'morphi';
import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { ManyToOne } from 'typeorm/decorator/relations/ManyToOne';
import { CATEGORY } from './CATEGORY';
import { JoinColumn } from 'typeorm/decorator/relations/JoinColumn';
import { Entity, EntityRepository, ManyToMany } from 'typeorm';
import { CategoryController } from '../controllers';
import { GROUP } from './GROUP';
import { CLASSNAME, FormlyForm, DefaultModelWithMapping } from 'morphi';
import { EnumValues } from 'enum-values';
import { MULTIMEDIA } from './core/MULTIMEDIA';



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

//#region @backend
@Entity(META.tableNameFrom(DIALOG))
//#endregion
@FormlyForm()
@DefaultModelWithMapping<DIALOG>({
  type: DialogType.HINT,
  lang_en: '',
  lang_fr: '',
  lang_pl: ''
}, {
    group: 'GROUP'
  })
@CLASSNAME('DIALOG')
export class DIALOG extends META.BASE_ENTITY<DIALOG, IDIALOG> implements IDIALOG {

  fromRaw(obj: IDIALOG): DIALOG {
    let dialog = new DIALOG();
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

  @ManyToOne(type => GROUP, group => group.id, {
    cascade: false
  })
  group: GROUP;

  @ManyToOne(type => MULTIMEDIA, m => m.id, {
    cascade: false
  })
  audio_pl?: MULTIMEDIA;

  @ManyToOne(type => MULTIMEDIA, m => m.id, {
    cascade: false
  })
  audio_en?: MULTIMEDIA;

  @ManyToOne(type => MULTIMEDIA, m => m.id, {
    cascade: false
  })
  audio_fr?: MULTIMEDIA;


}

