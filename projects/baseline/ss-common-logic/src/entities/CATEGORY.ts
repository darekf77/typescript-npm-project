import { Morphi } from 'morphi';
import * as _ from 'lodash';
import { GROUP, IGROUP } from './GROUP';
import { MULTIMEDIA } from './core/MULTIMEDIA';


export interface ICATEGORY {
  name: string;
  isPremium: boolean;
  picture?: MULTIMEDIA;
  groups: IGROUP[];
}


@Morphi.Entity<CATEGORY>({
  className: 'CATEGORY',
  formly: {
    exclude: ['path', 'groups', 'id']
  },
  defaultModelValues: {
    isPremium: false,
    name: '',
    // groups: []
  },
  mapping: {
    groups: 'GROUP',
    picture: 'MULTIMEDIA'
  }
})
export class CATEGORY extends Morphi.Base.Entity<CATEGORY, ICATEGORY> {

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

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number = undefined;

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  name: string = undefined;

  //#region @backend
  @Morphi.Orm.Column.Custom({
    type: 'boolean',
    nullable: true
  })
  //#endregion
  isPremium: boolean = false;

  get path() {
    return _.kebabCase(this.name);
  }

  //#region @backend
  @Morphi.Orm.Relation.OneToMany(type => GROUP, group => group.category, {
    cascade: false
  })
  //#endregion
  groups: GROUP[];

  //#region @backend
  @Morphi.Orm.Relation.ManyToOne(type => MULTIMEDIA, m => m.id, {
    cascade: false
  })
  //#endregion
  picture?: MULTIMEDIA;

}

