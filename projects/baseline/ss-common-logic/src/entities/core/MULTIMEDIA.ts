import { META } from '../../helpers';
//#region typeorm imports
import { Connection } from "typeorm/connection/Connection";
import { Repository } from "typeorm/repository/Repository";
import { AfterInsert } from "typeorm/decorator/listeners/AfterInsert";
import { AfterUpdate } from "typeorm/decorator/listeners/AfterUpdate";
import { BeforeUpdate } from "typeorm/decorator/listeners/BeforeUpdate";
import { OneToMany } from "typeorm/decorator/relations/OneToMany";
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany";
import { JoinTable } from "typeorm/decorator/relations/JoinTable";
import { Column } from "typeorm/decorator/columns/Column";
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/decorator/entity/Entity";
import { EntityRepository } from 'typeorm/decorator/EntityRepository';
import { CreateDateColumn } from "typeorm/decorator/columns/CreateDateColumn";
import { getCustomRepository } from 'typeorm';
//#endregion

//#region @backend
import * as path from "path";
import * as fse from "fs-extra";
import * as fs from "fs";
//#endregion
import { EnumValues } from 'enum-values';
import { kebabCase } from "lodash";
import { CLASSNAME, isNode, isBrowser, DefaultModelWithMapping } from 'morphi';
import { CATEGORY } from '../CATEGORY';
import { GROUP } from '../GROUP';

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


  @OneToMany(type => CATEGORY, cat => cat.picture, {
    cascade: false
  })
  catetories: CATEGORY[];


  @OneToMany(type => GROUP, group => group.picture, {
    cascade: false
  })
  groups: GROUP[];





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

export interface MULTIMEDIA_ALIASES {
  //#region @backend
  picture: string;
  audio: string;
  video: string;
  //#endregion
}


@EntityRepository(MULTIMEDIA)
export class MULTIMEDIA_REPOSITORY extends META.BASE_REPOSITORY<MULTIMEDIA, MULTIMEDIA_ALIASES> {

  //#region @backend
  globalAliases: (keyof MULTIMEDIA_ALIASES)[] = ['audio', 'video', 'picture']
  //#endregion


}

