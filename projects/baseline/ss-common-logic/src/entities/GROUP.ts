import { META } from '../helpers';
import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { ManyToOne } from 'typeorm/decorator/relations/ManyToOne';
import { CATEGORY } from './CATEGORY';
import { JoinColumn } from 'typeorm/decorator/relations/JoinColumn';
import { Entity, OneToMany, EntityRepository } from 'typeorm';
import { CategoryController } from '../controllers';
import { DIALOG, IDIALOG } from './DIALOG';
import { CLASSNAME } from 'morphi';

export interface IGROUP {
  id?: number;
  title: string;
  dialogs: IDIALOG[];
}

//#region @backend
@Entity(META.tableNameFrom(GROUP))
//#endregion
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


  @ManyToOne(type => CATEGORY, cat => cat.id, {
    cascadeAll: false,
  })
  category: CATEGORY = undefined


  @OneToMany(type => DIALOG, dial => dial.group, {
    cascadeUpdate: false,
    cascadeInsert: false
  })
  dialogs: DIALOG[] = [];

}

export interface GROUP_ALIASES {
  //#region @backend
  groups: string;
  group: string;
  //#endregion
}


@EntityRepository(GROUP)
export class GROUP_REPOSITORY extends META.BASE_REPOSITORY<GROUP, GROUP_ALIASES> {

  //#region @backend
  globalAliases: (keyof GROUP_ALIASES)[] = ['group', 'groups'];
  //#endregion

}
