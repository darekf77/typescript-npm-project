//#region @backend
import * as controllers from './controllers';
import * as entites from './entities';

const tControllers = {}
const tEntities = {}

function addController(controller: Function) {
  tControllers[controller.name] = controller;
}

function addEntity(entity: Function) {
  tEntities[entity.name] = entity;
}


addController(controllers.AuthController)
addController(controllers.CategoryController)

addEntity(entites.EMAIL)
addEntity(entites.EMAIL_TYPE)
addEntity(entites.USER)
addEntity(entites.SESSION)
addEntity(entites.DIALOG)
addEntity(entites.GROUP)
addEntity(entites.CATEGORY)

export const Controllers = tControllers;
export const Entities = tEntities;
//#endregion
