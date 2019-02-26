import { Morphi } from 'morphi';
import { CATEGORY } from '../category/CATEGORY';
import { GROUP } from '../group/GROUP';
import { DIALOG } from '../dialog/DIALOG';

//#region @backend
import * as path from "path";
import * as fse from "fs-extra";

//#endregion

export type MultimediaType = 'picture' | 'audio' | 'video';

const server = ENV.workspace.projects.find(p => p.name === 'ss-common-logic')

export interface IMULTIMEDIA {
  name: string;
  createdDate: Date;
}


@Morphi.Entity<MULTIMEDIA>({
  className: 'MULTIMEDIA',
  defaultModelValues: {
    name: ''
  },
  mapping: {
    catetories: ['CATEGORY'],
    dialogs: ['DIALOG'],
    groups: ['GROUP'],
    createdDate: 'Date'
  }
})
export class MULTIMEDIA extends Morphi.Base.Entity<MULTIMEDIA, IMULTIMEDIA> implements IMULTIMEDIA {

  //#region @backend

  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number = undefined;

  //#region @backend

  @Morphi.Orm.Column.CreateDate()
  //#endregion
  createdDate: Date = undefined

  //#region @backend

  @Morphi.Orm.Column.Custom('varchar', { length: 200, nullable: true })
  //#endregion
  name: string = null


  //#region @backend
  @Morphi.Orm.Column.Custom('varchar', { length: 20 })
  //#endregion
  type: MultimediaType;


  //#region @backend
  @Morphi.Orm.Relation.OneToMany(() => CATEGORY, cat => cat.picture, {
    cascade: false
  })
  //#endregion
  catetories: CATEGORY[];


  //#region @backend
  @Morphi.Orm.Relation.OneToMany(() => GROUP, group => group.picture, {
    cascade: false
  })
  //#endregion
  groups: GROUP[];


  //#region @backend
  @Morphi.Orm.Relation.OneToMany(() => DIALOG, dialog => dialog.id, {
    cascade: false
  })
  //#endregion
  dialogs: DIALOG[];





  public static mimetype = {
    picture: ['image/jpeg', 'image/png'],
    audio: ['audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg'],
    video: ['video/webm', 'video/ogg', 'video/mp4']
  }

  get path() {
    //#region @backend
    if (Morphi.IsNode) {
      if (!this.type) {
        throw Error(`Bad multimedia type for id ${this.id}`)
      }
      return path.join(ENV.pathes.backup[this.type], this.name)
    }
    //#endregion
    return `${server.host}/assets/${this.type}${this.name}`;
  }

  public static recreateFolder() {
    //#region @backend
    if (!fse.existsSync(ENV.pathes.backup.video)) {
      fse.mkdirpSync(ENV.pathes.backup.video)
    }

    if (!fse.existsSync(ENV.pathes.backup.audio)) {
      fse.mkdirpSync(ENV.pathes.backup.audio)
    }

    if (!fse.existsSync(ENV.pathes.backup.picture)) {
      fse.mkdirpSync(ENV.pathes.backup.picture)
    }

    //#endregion
  }

  fromRaw(obj: IMULTIMEDIA): MULTIMEDIA {
    throw new Error("Method not implemented.");
  }


}


