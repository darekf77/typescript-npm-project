
import { ProcessController, ExamplesController } from './controllers';
//#region @backend
import baseline from 'baseline/ss-common-logic/src/app';

// declare const ENV;
export default function () {
  baseline()
}

//#endregion

import {
  Controllers, Entities,
  //#region @backend
  InitDataPriority
  //#endregion
} from './index';

import { Morphi } from 'morphi';

async function start() {
  const project = ENV.workspace.projects.find(p => p.name === ENV.currentProjectName)

  await Morphi.init({
    //#region @backend
    publicAssets: [{ path: '/assets', location: ENV.pathes.backup.assets }],
    config: project.$db as any,
    //#endregion
    host: ENV.name !== 'local' ?
      `http://${ENV.ip}:${project.port}${project.baseUrl}` :
      `http://${ENV.ip}:${project.port}`
    ,
    controllers: Controllers,
    entities: Entities
  })
  // const buildCtr = new BuildController()
  // const builds = (await buildCtr.heelooeoe().received).body.json

  // console.log(builds)

  let pc = new ProcessController()
    let example = new ExamplesController();
    // console.log('pc', pc)
    // let loveme = await pc.killmeee().received;
    // console.log('loveme', loveme.body.text)
    // let p = new PROCESS()

    // await p.kill()

    // let proceses = await PROCESS.getAll()
    // console.log('proceses',proceses)

    const backednData = await pc.example().received;
    console.log('backednData',backednData.body.json)
}

if (Morphi.IsBrowser) {


  start()

}


