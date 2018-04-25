//#region @backend
import { Controllers as tControllers, Entities as tEntities } from "baseline/ss-common-logic/src/index";
import { USER } from "./entities/core/USER";

function addController(controller: Function) {
  tControllers[controller.name] = controller;
}

function addEntity(entity: Function) {
  tEntities[`__baseline${entity.name}`] = entity;
}

addEntity(USER);


export const Controllers = tControllers;
export const Entities = tEntities;
//#endregion
