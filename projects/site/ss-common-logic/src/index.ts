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


import { USER } from './entities/USER';
export { USER } from './entities/USER';
addEntity(USER);

import { EMAIL } from './entities/EMAIL';
export { EMAIL } from './entities/EMAIL';
addEntity(EMAIL);

import { EMAIL_TYPE } from './entities/EMAIL_TYPE';
export { EMAIL_TYPE } from './entities/EMAIL_TYPE';
addEntity(EMAIL_TYPE);


export const Controllers = BaselineControllers;
export const Entities = BaselineEntities;


