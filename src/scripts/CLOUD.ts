import * as path from 'path';
import { run } from '../process';
import { Project, ProjectFrom } from '../project';

function rebuildTnp() {
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
  $CLOUD_RESTART: () => {
    rebuildTnp()
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp start`).async();
  },
  $CLOUD_REBUILD: () => {
    rebuildTnp()
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp build`).sync();
    process.exit(0)
  },
  $CLOUD_CLEAR_ALL: () => {
    rebuildTnp()
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp clear:all`).sync();
    process.exit(0)
  },
  $CLOUD_CLEAR: () => {
    rebuildTnp()
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp clear`).sync();
    process.exit(0)
  }
}
