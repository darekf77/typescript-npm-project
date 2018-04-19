import { PrimaryGeneratedColumn } from 'typeorm/decorator/columns/PrimaryGeneratedColumn';
import { Column } from 'typeorm/decorator/columns/Column';
import { ManyToMany } from 'typeorm/decorator/relations/ManyToMany';
// local
import { META } from '../helpers';
import { DIALOG } from './DIALOG';



export class CATEGORY extends META.BASE_ENTITY {

  @PrimaryGeneratedColumn()
  id: number;

  @Column() name: string;


  @ManyToMany(type => DIALOG, dialog => dialog.id)
  emails: DIALOG[] = [];

}

export default CATEGORY;
