//#region @backend
import { Controllers as BaselienController, Entities as BaselineEntites } from "baseline/ss-common-logic/src/index";

import * as controllers from './controllers';
import * as entites from './entities';

import mocks from "baseline/ss-common-logic/src/db-mocks";
import { start } from "baseline/ss-common-logic/src/helpers";

const tControllers = BaselienController;
const tEntities = BaselineEntites;



function addController(controller: Function) {
  tControllers[controller.name] = controller;
}

function addEntity(entity: Function) {
  tEntities[entity.name] = entity;
}


addController(controllers.BuildController)

addEntity(entites.BUILD);



const project = ENV.workspace.projects.find(p => p.name === 'ss-common-logic')

export const Controllers = tControllers;
export const Entities = tEntities;


export default function () {
  start({
    publicFilesFolder: '/assets',
    config: project.$db as any,
    host: ENV.proxyRouterMode ?
      `http://localhost:${project.port}${project.baseUrl}` :
      `http://localhost:${project.port}`
    ,
    Controllers: Controllers as any,
    Entities: Entities as any,
    MockData: mocks as any
  });
}


//#endregion
