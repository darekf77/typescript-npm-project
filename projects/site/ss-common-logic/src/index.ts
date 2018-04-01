import { Controllers as BaselineControllers, Entities as BaselineEntities } from "baseline-ss-common-logic";

function addController(controller: Function) {
  BaselineControllers[controller.name] = controller;
}
function addEntity(entity: Function) {
  BaselineEntities[entity.name] = entity;
}

import { AuthControllerDecorator } from './controllers/AuthController';
export { AuthControllerDecorator } from './controllers/AuthController';
addController(AuthControllerDecorator);


import { SESSION_DECORATOR } from './entities/SESSION';
export { SESSION_DECORATOR } from './entities/SESSION';
addEntity(SESSION_DECORATOR);


import { USER_DECORATOR } from './entities/USER';
export { USER_DECORATOR } from './entities/USER';
addEntity(USER_DECORATOR);

import { EMAIL_DECORATOR } from './entities/EMAIL';
export { EMAIL_DECORATOR } from './entities/EMAIL';
addEntity(EMAIL_DECORATOR);

import { EMAIL_TYPE_DECORATOR } from './entities/EMAIL_TYPE';
export { EMAIL_TYPE_DECORATOR } from './entities/EMAIL_TYPE';
addEntity(EMAIL_TYPE_DECORATOR);


export const Controllers = BaselineControllers;
export const Entities = BaselineEntities;


