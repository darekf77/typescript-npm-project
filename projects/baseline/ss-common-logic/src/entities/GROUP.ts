import { META } from 'morphi';
import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { ManyToOne } from 'typeorm/decorator/relations/ManyToOne';
import { CATEGORY } from './CATEGORY';
import { Entity, OneToMany } from 'typeorm';
import { DIALOG, IDIALOG } from './DIALOG';
import { CLASSNAME, DefaultModelWithMapping, FormlyForm } from 'morphi';
import { MULTIMEDIA } from './core/MULTIMEDIA';



export interface IGROUP {
  id?: number;
  title: string;
  dialogs: IDIALOG[];
  picture?: MULTIMEDIA;
}

//#region @backend
@Entity(META.tableNameFrom(GROUP))
//#endregion
@FormlyForm<GROUP>(undefined, ['id'])
@DefaultModelWithMapping<GROUP>({
  title: ''
}, {
    picture: 'MULTIMEDIA'
  })
@CLASSNAME('GROUP')
export class GROUP extends META.BASE_ENTITY<GROUP, IGROUP> implements IGROUP {


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


  @PrimaryGeneratedColumn()
  id: number = undefined

  @Column()
  title: string = undefined

  @Column()
  amazing: string = ' asdmasdas'


  @ManyToOne(() => CATEGORY, cat => cat.id, {
    cascade: false
  })
  category: CATEGORY;


  @OneToMany(() => DIALOG, dial => dial.group, {
    cascade: false
  })
  dialogs: DIALOG[];

  @ManyToOne(() => MULTIMEDIA, m => m.id, {
    cascade: false
  })
  picture?: MULTIMEDIA;

}
