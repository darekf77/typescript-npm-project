//#region @backend
import { Controllers as tControllers, Entities as tEntities } from "baseline/ss-common-logic/src/index";
import { AuthController } from './controllers/core/AuthController';
import { USER } from "./entities/core/USER";

function addController(controller: Function) {
  tControllers[`__baseline${controller.name}`] = controller;
}

function addEntity(entity: Function) {
  tEntities[`__baseline${entity.name}`] = entity;
}

addController(AuthController)
addEntity(USER);



export const Controllers = tControllers;
export const Entities = tEntities;
//#endregion
