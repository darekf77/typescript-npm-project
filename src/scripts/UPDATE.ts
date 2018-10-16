//#region @backend
import { Project } from '../project';
import { info, error } from '../messages';
import * as fs from 'fs';
import * as path from 'path';



export function rebuildTnp() {
  const p = Project.Tnp;
  const backupFolderDist = 'tmp-dist-current';
  p.run(`rimraf ${backupFolderDist}`).sync();
  p.run(`git reset --hard`).sync();
  p.run(`git pull origin master`).sync();

  try {
    p.run(`cpr dist ${backupFolderDist}`).sync()
    p.run(`(tnp build:dist && rimraf ${backupFolderDist}) || (rimraf dist && cpr ${backupFolderDist} dist  && echo "Something went wrong with rebuild of tnp") `, { output: true }).sync()
    const backupDist = path.join(p.location, backupFolderDist);
    if (fs.existsSync(backupDist)) {
      p.run(`rimraf ${backupFolderDist}`);
      error(`Tnp self update not successfull`, false, true);
    } else {
      info(`Tnp self update success`);
    }
  } catch (e) {

  }
}


export default {
  $UPDATE: (args) => {
    rebuildTnp();
    process.exit(0)
  }

}
//#endregion
