
//#region @backend
import baseline from 'baseline/ss-common-logic/src/app';
// declare const ENV;
export default function () {
  baseline()
}

//#endregion

import { Morphi } from 'morphi';

async function start() {
  // const project = ENV.workspace.projects.find(p => p.name === ENV.currentProjectName)

  // Morphi.init({
  //   host: project.host,
  //   controllers: [BuildController],
  //   entities: [BUILD]
  // })

  // const buildCtr = new BuildController()
  // const builds = (await buildCtr.heelooeoe().received).body.json

  // console.log(builds)

  // console.log('heeloo thats amazinfg', ENV)
}

if (Morphi.IsBrowser) {


  start()

}


