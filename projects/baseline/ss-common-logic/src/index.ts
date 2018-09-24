//#region @backend
import * as controllers from './controllers';
// import * as entites from './entities';
import { Controllers } from './controllers';
import { Entities } from './entities';

import { start, META } from 'morphi';


export const InitDataPriority: META.BASE_CONTROLLER<any>[] = [
  controllers.ConfigController,
  controllers.AuthController,
] as any;

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
