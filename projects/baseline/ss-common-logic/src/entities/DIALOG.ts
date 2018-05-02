import { META } from '../helpers';
import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { ManyToOne } from 'typeorm/decorator/relations/ManyToOne';
import { CATEGORY } from './CATEGORY';
import { JoinColumn } from 'typeorm/decorator/relations/JoinColumn';
import { Entity } from 'typeorm';
import { CategoryController } from '../controllers';
import { GROUP } from './GROUP';

export interface IDIALOG {
  id?: number;
  lang_pl: string;
  lang_en: string;
  lang_fr: string;
  comment: string;

}

@Entity(META.tableNameFrom(DIALOG))
export class DIALOG extends META.BASE_ENTITY<DIALOG, IDIALOG> implements IDIALOG {

  fromRaw(obj: IDIALOG): DIALOG {
    let dialog = new DIALOG();
    dialog.comment = obj.comment;
    dialog.lang_en = obj.lang_en;
    dialog.lang_fr = obj.lang_fr;
    dialog.lang_pl = obj.lang_pl;
    return dialog;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column() lang_pl: string;
  @Column() lang_en: string;
  @Column() lang_fr: string;

  @Column({
    nullable: true
  }) comment: string;


  @ManyToOne(type => GROUP, cat => cat.id, {
    cascadeAll: false
  })
  @JoinColumn()
  group: GROUP;


}

export default DIALOG;
