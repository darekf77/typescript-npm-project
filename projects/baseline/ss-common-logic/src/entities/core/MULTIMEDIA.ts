import { META } from 'morphi';
import { OneToMany } from "typeorm/decorator/relations/OneToMany";
import { Column } from "typeorm/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/decorator/entity/Entity";
import { CreateDateColumn } from "typeorm/decorator/columns/CreateDateColumn";
import { CLASSNAME, isNode, DefaultModelWithMapping } from 'morphi';
import { CATEGORY } from '../CATEGORY';
import { GROUP } from '../GROUP';
import { DIALOG } from '../DIALOG';

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

//#region @backend
@Entity(META.tableNameFrom(MULTIMEDIA))
//#endregion
@DefaultModelWithMapping<MULTIMEDIA>({
  name: ''
})
@CLASSNAME('MULTIMEDIA')
export class MULTIMEDIA extends META.BASE_ENTITY<MULTIMEDIA, IMULTIMEDIA> implements IMULTIMEDIA {


  @PrimaryGeneratedColumn()
  id: number = undefined;

  @CreateDateColumn()
  createdDate: Date = undefined

  @Column('varchar', { length: 200, nullable: true })
  name: string = null


  @Column('varchar', { length: 20 })
  type: MultimediaType;


  @OneToMany(() => CATEGORY, cat => cat.picture, {
    cascade: false
  })
  catetories: CATEGORY[];


  @OneToMany(() => GROUP, group => group.picture, {
    cascade: false
  })
  groups: GROUP[];



  @OneToMany(() => DIALOG, dialog => dialog.id, {
    cascade: false
  })
  dialogs: DIALOG[];





  public static mimetype = {
    picture: ['image/jpeg', 'image/png'],
    audio: ['audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg'],
    video: ['video/webm', 'video/ogg', 'video/mp4']
  }

  get path() {
    //#region @backend
    if (isNode) {
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


