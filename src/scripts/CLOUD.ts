
//#region @backend
import * as path from 'path';
import { run } from '../process';
import { Project, ProjectFrom } from '../project';
import { rebuildTnp } from './UPDATE';




export default {
  $CLOUD_RESTART: (args) => {
    rebuildTnp()
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp start`).async();
  },
  $CLOUD_REBUILD: (args) => {
    rebuildTnp()
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp init --env=online`).sync();
    cloudProject.run(`tnp build`).sync();
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
//#endregion
