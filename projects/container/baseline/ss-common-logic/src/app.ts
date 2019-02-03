import "reflect-metadata";
import { Morphi } from 'morphi'
import { Helpers } from 'morphi/helpers'


//#region @cutRegionIfFalse ENV.currentProjectName === 'ss-common-ui'
import { ProcessController } from './controllers';
import { PROCESS } from './entities';
//#endregion

import {
  Controllers, Entities,
  //#region @backend
  InitDataPriority
  //#endregion
} from './index';


async function start() {
  const project = ENV.workspace.projects.find(p => p.name === ENV.currentProjectName)
  await Morphi.init({
    //#region @backend
    publicAssets: [{ path: '/assets', location: ENV.pathes.backup.assets }],
    config: project.$db as any,
    InitDataPriority,
    //#endregion
    host: ENV.name !== 'local' ?
      `http://${ENV.ip}:${project.port}${project.baseUrl}` :
      `http://${ENV.ip}:${project.port}`
    ,
    hostSocket: `http://${ENV.ip}:${project.port}`,
    controllers: Controllers,
    entities: Entities
  })

  //#region @cutRegionIfFalse ENV.currentProjectName === 'ss-common-ui'
  if (Morphi.IsBrowser) {
    // let ProcessControllerFN: ProcessController = Controllers.find(c => (c as any).name === 'ProcessController') as any;
    // console.log('ctrlFN',ctrlFN)
    // let pc = Helpers.getSingleton<ProcessController>(ctrlFN);
    let pc = new ProcessController()
    console.log('pc',pc)
    let loveme = await pc.killmeee().received;
    console.log('loveme', loveme.body.text)
    let p = new PROCESS()

     await p.kill()
  }
  //#endregion

}

export default start;


//#region @cutRegionIfFalse ENV.currentProjectName === 'ss-common-ui'
if (Morphi.IsBrowser) {
  start()
}
//#endregion
