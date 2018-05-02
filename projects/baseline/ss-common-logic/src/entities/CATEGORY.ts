import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { ManyToMany } from 'typeorm/decorator/relations/ManyToMany';
import { Entity, JoinTable, OneToMany } from 'typeorm';
// local
import { META } from '../helpers';
import { kebabCase } from 'lodash';
import { GROUP } from './GROUP';

@Entity(META.tableNameFrom(CATEGORY))
export class CATEGORY extends META.BASE_ENTITY {

  @PrimaryGeneratedColumn()
  id: number;

  @Column() name: string;

  @Column('boolean') isPremium: boolean = false;

  get path() {
    return kebabCase(this.name);
  }

  @OneToMany(type => GROUP, dial => dial.category, {
    cascadeUpdate: false,
    cascadeInsert: false
  })
  groups: GROUP[] = [];

}

export default CATEGORY;
