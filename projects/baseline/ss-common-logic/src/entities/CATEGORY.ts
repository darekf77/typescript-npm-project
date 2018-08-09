import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { ManyToMany } from 'typeorm/decorator/relations/ManyToMany';
import { Entity, JoinTable, OneToMany, EntityRepository } from 'typeorm';
// local
import { META } from '../helpers';
import { kebabCase } from 'lodash';
import { GROUP, IGROUP } from './GROUP';
import { CLASSNAME, DefaultModelWithMapping, FormlyForm } from 'morphi';

export interface ICATEGORY {
  name: string;
  isPremium: boolean;
  groups: IGROUP[]
}

//#region @backend
@Entity(META.tableNameFrom(CATEGORY))
//#endregion
@FormlyForm<CATEGORY>(undefined, ['path'])
@DefaultModelWithMapping<CATEGORY>({
  isPremium: false,
  name: ''
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
    cascadeUpdate: false,
    cascadeInsert: false,
  })
  groups: GROUP[] = [];

}

export interface CATEGORY_ALIASES {
  //#region @backend
  categories: string;
  category: string;
  //#endregion
}

@EntityRepository(CATEGORY)
export class CATEGORY_REPOSITORY extends META.BASE_REPOSITORY<CATEGORY, CATEGORY_ALIASES> {

  //#region @backend
  globalAliases: (keyof CATEGORY_ALIASES)[] = ['category', 'categories']
  //#endregion

}
