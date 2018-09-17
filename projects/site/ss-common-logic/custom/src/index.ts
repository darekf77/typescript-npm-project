//#region @backend
import {
  Controllers as BaselienController, Entities as BaselineEntites,
  InitDataPriority
} from "baseline/ss-common-logic/src/index";

import * as controllers from './controllers';
import * as entites from './entities';

import { start, RemoveEvent, UpdateEvent, InsertEvent, EntitySubscriberInterface, EventSubscriber } from "morphi";
import { BUILD } from "./entities/BUILD";

const tControllers = BaselienController;
const tEntities = BaselineEntites;



function addController(controller: Function) {
  tControllers[controller.name] = controller;
}

function addEntity(entity: Function) {
  tEntities[entity.name] = entity;
}


addController(controllers.BuildController)
addController(controllers.DomainsController)

addEntity(entites.BUILD);
addEntity(entites.DOMAIN);



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
    hostSocket: `http://localhost:${project.port}`,
    Controllers: Controllers as any,
    Entities: Entities as any,
    InitDataPriority: InitDataPriority as any,
    subscribers: []
  });
}


//#endregion
