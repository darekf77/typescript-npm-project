import * as low from 'lowdb';
import * as fse from 'fs-extra';
import { LowdbSync } from 'lowdb';
import * as path from 'path';
import * as FileSync from 'lowdb/adapters/FileSync'
import { Project } from './project/base-project';

export interface TnpDBModel {

  projects: Project[];

}

export class TnpDB {

  private _adapter;
  private db;
  public init(recreate = false) {
    if (recreate) {
      fse.writeFileSync(this.location, '')
    }
    this._adapter = new FileSync(this.location)
    this.db = low(this._adapter)
    if (recreate) {
      this.db.defaults({ projects: [], domains: [], ports: [] })
        .write()
    }
  }
  constructor(public location: string) {

    this.init(!fse.existsSync(location))

  }


}

export async function initJsonDb() {

  const location = path.join(Project.Tnp.location, `bin/db.json`);
  let database = new TnpDB(location);

}
