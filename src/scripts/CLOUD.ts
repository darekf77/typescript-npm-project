
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
    CloudHelpers.safeRebuildAndRun(args);
    process.exit(0)
  },

  $CLOUD_UPDATE(args) {
    CloudHelpers.safeRebuildAndRun(args);
    process.exit(0)
  },


  $CLOUD_BUILD: (args) => {
    CloudHelpers.reinit()
    CloudHelpers.cloudBuild()
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
        run(`clear && curl http://localhost:${cloudProject.env.config.cloud.ports.update}/status | json_pp --json_opt=canonical,pretty`).sync()
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

