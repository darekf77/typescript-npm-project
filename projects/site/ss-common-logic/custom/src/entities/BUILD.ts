import { META } from "baseline/ss-common-logic/src/helpers";
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { FormlyForm, DefaultModelWithMapping } from 'morphi';

export interface IBUILD {
  name: string;
}


//#region @backend
@Entity(META.tableNameFrom(BUILD))
//#endregion
@FormlyForm<BUILD>()
@DefaultModelWithMapping<BUILD>({
  gitFolder: '/',
  gitRemote: ''
})
export class BUILD extends META.BASE_ENTITY<BUILD> {

  @PrimaryGeneratedColumn()
  id: number;

  fromRaw(obj: BUILD): BUILD {
    throw new Error("Method not implemented.");
  }


  @Column({ nullable: true }) port: string;
  @Column() gitRemote: string;
  @Column({ nullable: true, default: '/' }) gitFolder: string;


}

export default BUILD;
