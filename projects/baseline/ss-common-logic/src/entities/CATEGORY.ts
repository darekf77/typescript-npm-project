import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { ManyToMany } from 'typeorm/decorator/relations/ManyToMany';
import { Entity, JoinTable, OneToMany } from 'typeorm';
// local
import { META } from '../helpers';
import { DIALOG } from './DIALOG';
import { kebabCase } from 'lodash';


@Entity(META.tableNameFrom(CATEGORY))
export class CATEGORY extends META.BASE_ENTITY {

  @PrimaryGeneratedColumn()
  id: number;

  @Column() name: string;

  path() {
    return kebabCase(this.name);
  }


  @OneToMany(type => DIALOG, dial => dial.category, {
    cascadeUpdate: false,
    cascadeInsert: false
  })
  dialogs: DIALOG[] = [];

}

export default CATEGORY;
