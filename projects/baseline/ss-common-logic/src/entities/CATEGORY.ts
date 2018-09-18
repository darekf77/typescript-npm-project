import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { ManyToMany } from 'typeorm/decorator/relations/ManyToMany';
import { Entity, JoinTable, OneToMany, EntityRepository, JoinColumn, ManyToOne } from 'typeorm';
import { META } from 'morphi';
import { kebabCase } from 'lodash';
import { GROUP, IGROUP } from './GROUP';
import { CLASSNAME, DefaultModelWithMapping, FormlyForm } from 'morphi';
import { MULTIMEDIA } from './core/MULTIMEDIA';


export interface ICATEGORY {
  name: string;
  isPremium: boolean;
  picture?: MULTIMEDIA;
  groups: IGROUP[];
}

//#region @backend
@Entity(META.tableNameFrom(CATEGORY))
//#endregion
@FormlyForm<CATEGORY>(undefined, ['path', 'groups', 'id'])
@DefaultModelWithMapping<CATEGORY>({
  isPremium: false,
  name: '',
  // groups: []
}, {
    groups: 'GROUP',
    picture: 'MULTIMEDIA'
  })
@CLASSNAME('CATEGORY')
export class CATEGORY extends META.BASE_ENTITY<CATEGORY, ICATEGORY> {

  fromRaw(obj: ICATEGORY): CATEGORY {
    let category = new CATEGORY();
    category.name = obj.name;
    category.isPremium = obj.isPremium;
    category.groups = obj.groups.map(g => {
      let group = new GROUP()
      group = group.fromRaw(g);
      group.category = category;
      return group;
    })
    return category;
  }

  @PrimaryGeneratedColumn()
  id: number = undefined;

  @Column() name: string = undefined;

  @Column({
    type: 'boolean',
    nullable: true
  }) isPremium: boolean = false;

  get path() {
    return kebabCase(this.name);
  }

  @OneToMany(type => GROUP, group => group.category, {
    cascade: false
  })
  groups: GROUP[];


  @ManyToOne(type => MULTIMEDIA, m => m.id, {
    cascade: false
  })
  picture?: MULTIMEDIA;

}

