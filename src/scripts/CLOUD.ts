
//#region @backend
import * as path from 'path';
import { run } from '../process';
import { Project, ProjectFrom } from '../project';
import { rebuildTnp } from './UPDATE';
import { paramsFrom } from '../helpers';
import { $CLOUD_INSTALL } from './CLOUD-install';
import { $CLOUD_SELF_REBUILD_AND_RUN } from './CLOUD-self-update';
import { CloudHelpers } from './CLOUD-helpers';





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
    const cloudProject = CloudHelpers.cloudProject();
    cloudProject.run(`tnp start </dev/null &>/dev/null &`).sync();
    process.exit(0)
  },


  $CLOUD_REBUILD: (args) => {
    const cloudProject = CloudHelpers.cloudProject();
    cloudProject.run(`tnp clear`).sync();
    cloudProject.run(`tnp init --env=online`).sync();
    cloudProject.run(`tnp build`).sync();
    process.exit(0)
  },


  $CLOUD_CLEAR_ALL: (args) => {
    const cloudProject = CloudHelpers.cloudProject();
    cloudProject.run(`tnp clear:all ${args}`).sync();
    process.exit(0)
  },


  $CLOUD_CLEAR: (args) => {
    const cloudProject = CloudHelpers.cloudProject();
    cloudProject.run(`tnp clear ${args}`).sync();
    process.exit(0)
  },

  $CLOUD_MONITOR() {
    const cloudProject = CloudHelpers.cloudProject();
    function display() {
      try {
        run(`clear && curl http://localhost:${cloudProject.env.config.cloud.ports.update}/status | json_pp`).sync()
      } catch (error) {
        console.log('Not able to get server info');
      }

      setTimeout(() => {
        display()
      }, 1000)
    }
    display()
  }


}
//#endregion

