
//#region @backend
import * as path from 'path';
import { run } from '../process';
import { Project, ProjectFrom } from '../project';
import { rebuildTnp } from './UPDATE';



export default {
  $CLOUD_RESTART: (args) => {
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp start </dev/null &>/dev/null &`).  sync();
    process.exit(0)
  },
  $CLOUD_REBUILD: (args) => {
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp clear`).sync();
    cloudProject.run(`tnp init --env=online`).sync();
    cloudProject.run(`tnp build`).sync();
    process.exit(0)
  },
  $CLOUD_CLEAR_ALL: (args) => {
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp clear:all ${args}`).sync();
    process.exit(0)
  },
  $CLOUD_CLEAR: (args) => {
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp clear ${args}`).sync();
    process.exit(0)
  }
}
//#endregion
