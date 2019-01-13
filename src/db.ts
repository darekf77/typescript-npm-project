import * as low from 'lowdb';
import * as fse from 'fs-extra';
import { LowdbSync } from 'lowdb';
import * as path from 'path';
import * as FileSync from 'lowdb/adapters/FileSync'
import { Project } from './project/base-project';


export async function initJsonDb() {
  const location = path.join(Project.Tnp.location, `bin/db.json`);
  let isInit = false;
  if (!fse.existsSync(location)) {
    isInit = true;
    fse.writeFileSync(location, '')
  }
  const adapter = new FileSync(location)
  const db = low(adapter)
  if (isInit) {
    db.defaults({ projects: [], domains: [], ports: [] })
      .write()
  }


}
