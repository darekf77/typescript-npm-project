
//#region @backend
import * as path from 'path';
import { run } from '../process';
import { Project, ProjectFrom } from '../project';
import { rebuildTnp } from './UPDATE';
import { paramsFrom } from '../helpers';
import { $CLOUD_INSTALL } from './CLOUD-install';
import { $CLOUD_SELF_UPDATE } from './CLOUD-self-update';




export default {

  $CLOUD_INSTALL,
  $CLOUD_SELF_UPDATE,
  $CLOUD_UPDATE: $CLOUD_SELF_UPDATE,

  $CLOUD_RESTART: (args) => {
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    cloudProject.run(`tnp start </dev/null &>/dev/null &`).sync();
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
  },



}
//#endregion

