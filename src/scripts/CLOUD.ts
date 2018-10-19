
//#region @backend
import * as path from 'path';
import { run } from '../process';
import { Project, ProjectFrom } from '../project';
import { rebuildTnp } from './UPDATE';
import { paramsFrom } from '../helpers';
import { $CLOUD_INSTALL } from './CLOUD-install';
import { $CLOUD_SELF_REBUILD_AND_RUN } from './CLOUD-self-update';





export default {

  $CLOUD_INSTALL,
  $CLOUD_SELF_REBUILD_AND_RUN,

  $CLOUD_SELF_UPDATE(args) {
    run(`tnp ${paramsFrom($CLOUD_SELF_REBUILD_AND_RUN.name)} ${args} &`).sync();
    process.exit(0)
  },

  $CLOUD_UPDATE(args) {
    run(`tnp ${paramsFrom($CLOUD_SELF_REBUILD_AND_RUN.name)} ${args} &`).sync();
    process.exit(0)
  },

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

  $CLOUD_MONITOR() {
    const cloudProject = ProjectFrom(path.join(Project.Tnp.location, 'projects/site'));
    function display() {
      run(`clear && curl http://localhost:${cloudProject.env.config.cloud.ports.update}/status | json_pp`).sync()
      setTimeout(() => {
        display()
      }, 1000)
    }
    display()
  }


}
//#endregion

