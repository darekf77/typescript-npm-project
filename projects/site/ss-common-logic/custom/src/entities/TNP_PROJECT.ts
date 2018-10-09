import {
  Entity, META, DefaultModelWithMapping, PrimaryGeneratedColumn,
  Column, TreeChildren, TreeParent, Tree
} from "morphi";
import BUILD from "./BUILD";
import * as _ from 'lodash';

import { PROGRESS_BAR_DATA, Project, EnvConfigProject, LibType } from "tnp-bundle";
import { CLASSNAME, FormlyForm } from "morphi";

//#region @backend
import * as path from 'path';
import { run } from "tnp-bundle";
import { ProjectFrom, RunOptions } from "tnp-bundle";
//#endregion

export interface ITNP_PROJECT {
  name: string;

  pidBuildProces: number;
  pidClearProces: number;
  pidServeProces: number;
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
export class TNP_PROJECT extends META.BASE_ENTITY<TNP_PROJECT> implements EnvConfigProject {
  baseUrl: string;
  host?: string;
  hostSocket?: string;
  externalHost?: string;
  type?: LibType;
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

  //#region @backend
  get servelogFilePath() {
    return path.join(this.location, 'tmp-server-log.txt');
  }

  get serverErrorslogFilePath() {
    return path.join(this.location, 'tmp-serve-errors-log.txt');
  }

  get buildlogFilePath() {
    return path.join(this.location, 'tmp-build-log.txt');
  }

  get buildErrorslogFilePath() {
    return path.join(this.location, 'tmp-build-errors-log.txt');
  }

  //#endregion

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

  get buildInProgress() {
    return (_.isNumber(this.pidBuildProces));
  }

  get serveInProgress() {
    return (_.isNumber(this.pidServeProces));
  }

  get clearInProgress() {
    return (_.isNumber(this.pidServeProces));
  }

  @Column({ nullable: true }) port: number;
  @Column({ nullable: true }) pidBuildProces: number;
  @Column({ nullable: true }) pidClearProces: number;
  @Column({ nullable: true }) pidServeProces: number;

  get info() {
    return this.progress && this.progress.html;
  }

  //#region @backend
  run(command: string, options?: RunOptions) {
    const self = this;
    if (!options) {
      options = {};
    }
    return {
      async() {
        return run(command,
          _.merge(options, {
            // output: false,
            cwd: self.location
          })
        ).async()
      },
      sync() {
        return run(command,
          _.merge(options, {
            // output: false,
            cwd: self.location
          })
        ).sync()
      },
    }
  }
  //#endregion

}
