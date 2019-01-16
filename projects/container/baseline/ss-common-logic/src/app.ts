import "reflect-metadata";
import { Morphi } from 'morphi'


//#region @backend
import { Controllers, Entities, InitDataPriority } from './index';

export default function () {
  const project = ENV.workspace.projects.find(p => p.name === ENV.currentProjectName)
  Morphi.init({
    publicAssets: [{ path: '/assets', location: ENV.pathes.backup.assets }],
    config: project.$db as any,
    host: ENV.name !== 'local' ?
      `http://${ENV.ip}:${project.port}${project.baseUrl}` :
      `http://${ENV.ip}:${project.port}`
    ,
    hostSocket: `http://${ENV.ip}:${project.port}`,
    controllers: Controllers,
    entities: Entities,
    InitDataPriority
  })
}

//#endregion
