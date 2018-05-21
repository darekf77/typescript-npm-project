//#region @backend
import * as controllers from './controllers';
import * as entites from './entities';
import mocks from "./db-mocks";
import { start } from './helpers';

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
addController(controllers.MultimediaController)

addEntity(entites.EMAIL)
addEntity(entites.EMAIL_TYPE)
addEntity(entites.USER)
addEntity(entites.SESSION)
addEntity(entites.DIALOG)
addEntity(entites.GROUP)
addEntity(entites.CATEGORY)
addEntity(entites.MULTIMEDIA)

export const Controllers = tControllers;
export const Entities = tEntities;

export default function () {
  start({
    config: ENV.currentProject.$db as any,
    host: ENV.currentProject.host,
    Controllers: Controllers as any,
    Entities: Entities as any,
    MockData: mocks as any
  });
}


//#endregion
