import { BUILD } from "./BUILD";
import * as _ from 'lodash';

import { PROGRESS_BAR_DATA, Project, EnvConfigProject, LibType, EnvironmentName } from "tnp-bundle";
import { Morphi } from "morphi";

//#region @backend
import * as path from 'path';
import { run } from "tnp-bundle";
import { ProjectFrom, RunOptions } from "tnp-bundle";
//#endregion


export interface SelfUpdate {
  progress: PROGRESS_BAR_DATA;
  child: string;
  operation: string;
  operationErrors: string[];
}

export interface ITNP_PROJECT {
  name: string;

  pidBuildProces: number;
  pidClearProces: number;
  pidServeProces: number;
}


@Morphi.Entity<TNP_PROJECT>({
  className: 'TNP_PROJECT',
  tree: 'closure-table',
  mapping: {
    progress: PROGRESS_BAR_DATA
  }
})
export class TNP_PROJECT extends Morphi.Base.Entity<TNP_PROJECT> implements EnvConfigProject {
  baseUrl: string;
  host?: string;
  hostSocket?: string;
  externalHost?: string;


  fromRaw(obj: ITNP_PROJECT): TNP_PROJECT {
    return _.merge(new TNP_PROJECT(), obj);
  }

  private static fromProject(data: Project): TNP_PROJECT {
    return _.merge(new TNP_PROJECT(), {
      name: data.name,
      location: data.location,
      isWorkspace: data.isWorkspace,
      type: data.type
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

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number;

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  location: string;

  //#region @backend
  @Morphi.Orm.Column.Custom({
    type: 'boolean',
    default: false
  })
  //#endregion
  isWorkspace?: boolean = false;

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  name: string;

  //#region @backend
  @Morphi.Orm.Column.Custom('varchar', { nullable: true })
  //#endregion
  type?: LibType;

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  environmentName: string;

  //#region @backend
  @Morphi.Orm.Column.Custom('simple-json', { nullable: true })
  //#endregion
  progress: PROGRESS_BAR_DATA;

  //#region @backend
  @Morphi.Orm.Column.Custom('simple-array')
  //#endregion
  environments?: EnvironmentName[] = [];

  //#region @backend
  @Morphi.Orm.Tree.Children()
  //#endregion
  children: TNP_PROJECT[];

  //#region @backend
  @Morphi.Orm.Tree.Parent()
  //#endregion
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

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  port: number;

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  pidBuildProces: number;


  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  pidClearProces: number;


  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  pidChangeEnvProces: number;


  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  pidServeProces: number;

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
