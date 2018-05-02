import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { ManyToMany } from 'typeorm/decorator/relations/ManyToMany';
import { Entity, JoinTable, OneToMany } from 'typeorm';
// local
import { META } from '../helpers';
import { kebabCase } from 'lodash';
import { GROUP, IGROUP } from './GROUP';

export interface ICATEGORY {
  name: string;
  groups: IGROUP[]
}

@Entity(META.tableNameFrom(CATEGORY))
export class CATEGORY extends META.BASE_ENTITY<CATEGORY, ICATEGORY> {

  fromRaw(obj: ICATEGORY): CATEGORY {
    let category = new CATEGORY();
    category.name = obj.name;
    category.groups = obj.groups.map(g => {
      let group = new GROUP()
      group = group.fromRaw(g);
      group.category = category;
      return group;
    })
    return category;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column() name: string;

  @Column('boolean') isPremium: boolean = false;

  get path() {
    return kebabCase(this.name);
  }

  @OneToMany(type => GROUP, group => group.category, {
    cascadeUpdate: false,
    cascadeInsert: false,
  })
  groups: GROUP[] = [];

}

export default CATEGORY;
