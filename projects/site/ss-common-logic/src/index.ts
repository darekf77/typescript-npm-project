import { Controllers as BaselineControllers, Entities as BaselineEntities } from "baseline/ss-common-logic/bundle";

function addController(controller: Function) {
  BaselineControllers[controller.name] = controller;
}
function addEntity(entity: Function) {
  BaselineEntities[entity.name] = entity;
}

import { AuthController } from './controllers/AuthController';
export { AuthController } from './controllers/AuthController';
addController(AuthController);


import { SESSION } from './entities/SESSION';
export { SESSION } from './entities/SESSION';
addEntity(SESSION);


export const Controllers = BaselineControllers;
export const Entities = BaselineEntities;


