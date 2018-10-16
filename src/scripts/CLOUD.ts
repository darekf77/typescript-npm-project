
//#region @backend
import * as path from 'path';
import { run } from '../process';
import { Project, ProjectFrom } from '../project';
import { rebuildTnp } from './UPDATE';
import { $CLOUD_SAFE_REBUILD_START } from './CLOUD-safe-rebuild';
import { paramsFrom } from '../helpers';




export default {

  // $CLOUD_TEST1: () => {
  //   function test() {
  //     console.log(`test pid: ${process.pid}, ppid: ${process.ppid}`)
  //     setTimeout(() => {
  //       test()
  //     }, 2000)
  //   }

  //   test();
  // },

  // $CLOUD_TEST: () => {
  //   run(`tnp cloud:test1 &`).sync();
  //   process.exit(0)
  // },

  $CLOUD_SAFE_REBUILD_START,

  $CLOUD_UPDATE: (args) => {
    run(`tnp ${paramsFrom($CLOUD_SAFE_REBUILD_START.name)} ${args} &`).sync();
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



}
//#endregion

