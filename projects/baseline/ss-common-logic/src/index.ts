const controllers = {};
const entities = {};
function addController(controller: Function) {
  controllers[controller.name] = controller;
}
function addEntity(entity: Function) {
  entities[entity.name] = entity;
}

import { AuthController } from './controllers/AuthController';
export { AuthController } from './controllers/AuthController';
addController(AuthController);

import { EMAIL_TYPE } from './entities/EMAIL_TYPE';
export { EMAIL_TYPE } from './entities/EMAIL_TYPE';
addEntity(EMAIL_TYPE);

import { EMAIL } from './entities/EMAIL';
export { EMAIL } from './entities/EMAIL';
addEntity(EMAIL);

import { USER } from './entities/USER';
export { USER } from './entities/USER';
addEntity(USER);

import { SESSION } from './entities/SESSION';
export { SESSION} from './entities/SESSION';
addEntity(SESSION);

export const Controllers = controllers;
export const Entities = entities;


