import { Project } from '../project';

export function rebuildTnp() {
    const p = Project.Tnp;
    const backupFolderDist = 'tmp-dist-current';
    p.run(`rimraf ${backupFolderDist}`).sync();
    p.run(`git reset --hard`).sync();
    p.run(`git pull origin master`).sync();
    try {
      p.run(`cpr dist ${backupFolderDist}`).sync()
      p.run(`(rimraf dist && tsc) || (cpr ${backupFolderDist} dist  && echo "Something went wrong with rebuild of tnp") `).sync()
    } catch (error) {
  
    }
  }


export default {
    $UPDATE: (args) => {
        rebuildTnp();
        process.exit(0)
    }
}