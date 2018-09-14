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
  $CLOUD_RESTART: (args) => {
    rebuildTnp()
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp start ${args}`).async();
  },
  $CLOUD_REBUILD: (args) => {
    rebuildTnp()
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp build ${args}`).sync();
    process.exit(0)
  },
  $CLOUD_CLEAR_ALL: (args) => {
    rebuildTnp()
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp clear:all ${args}`).sync();
    process.exit(0)
  },
  $CLOUD_CLEAR: (args) => {
    rebuildTnp()
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp clear ${args}`).sync();
    process.exit(0)
  }
}
