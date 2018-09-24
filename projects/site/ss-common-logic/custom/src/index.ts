//#region @backend
import { InitDataPriority } from "baseline/ss-common-logic/src/index";
import { Controllers } from './controllers';
import { Entities } from './entities';

import { start } from "morphi";

const project = ENV.workspace.projects.find(p => p.name === ENV.currentProjectName)

export default function () {
  start({
    publicFilesFolder: '/assets',
    config: project.$db as any,
    host: ENV.name !== 'local' ?
      `http://${ENV.ip}:${project.port}${project.baseUrl}` :
      `http://${ENV.ip}:${project.port}`
    ,
    hostSocket: `http://${ENV.ip}:${project.port}`,
    Controllers,
    Entities,
    InitDataPriority
  });
}

//#endregion
