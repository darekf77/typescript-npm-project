import { Entity, META, DefaultModelWithMapping, PrimaryGeneratedColumn, Column, TreeChildren, TreeParent, Tree } from "morphi";
import BUILD from "./BUILD";
import * as _ from 'lodash';

import { PROGRESS_BAR_DATA, Project } from "tnp-bundle";
import { CLASSNAME, FormlyForm } from "morphi";

//#region @backend
import { ProjectFrom } from "tnp-bundle";
//#endregion

export interface ITNP_PROJECT {

}


//#region @backend
@Entity(META.tableNameFrom(TNP_PROJECT))
@Tree("closure-table")
//#endregion
@FormlyForm<TNP_PROJECT>()
@DefaultModelWithMapping<TNP_PROJECT>({

}, {
    progress: PROGRESS_BAR_DATA
  })
@CLASSNAME('TNP_PROJECT')
export class TNP_PROJECT extends META.BASE_ENTITY<TNP_PROJECT>  {
  fromRaw(obj: ITNP_PROJECT): TNP_PROJECT {
    return _.merge(new TNP_PROJECT(), obj);
  }

  private static fromProject(data: Project): TNP_PROJECT {
    return _.merge(new TNP_PROJECT(), {
      name: data.name,
      location: data.location,
    });
  }

  static from(location: string) {
    //#region @backendFunc
    const proj = ProjectFrom(location)
    const p = this.fromProject(proj);

    if (proj) {
      p.children = proj.children.map(c => {
        return this.from(c.location);
      })
    }
    return p;
    //#endregion
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  location: string;

  @Column()
  name: string;

  @Column('simple-json', { nullable: true }) progress: PROGRESS_BAR_DATA;


  @TreeChildren()
  children: TNP_PROJECT[];

  @TreeParent()
  parent: TNP_PROJECT;


}
