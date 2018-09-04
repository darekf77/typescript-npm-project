//#region @backend
import { Controllers as tControllers, Entities as tEntities } from "baseline/ss-common-logic/src/index";
import mocks from "baseline/ss-common-logic/src/db-mocks";
import { USER } from "./entities/core/USER";
import { start } from "baseline/ss-common-logic/src/helpers";
import { BUILD } from "./entities/BUILD";

function addController(controller: Function) {
  tControllers[`__baseline${controller.name}`] = controller;
}

function addEntity(entity: Function) {
  tEntities[`__baseline${entity.name}`] = entity;
}

addEntity(USER);
addEntity(BUILD);

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
