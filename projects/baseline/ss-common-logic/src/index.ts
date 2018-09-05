//#region @backend
import * as controllers from './controllers';
import * as entites from './entities';

import { start, META } from './helpers';

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
addController(controllers.ExamplesController)
addController(controllers.GroupsController);
addController(controllers.ExamplesPaginationController);
addController(controllers.DialogsController)
addController(controllers.ConfigController)

addEntity(entites.EMAIL)
addEntity(entites.EMAIL_TYPE)
addEntity(entites.USER)
addEntity(entites.SESSION)
addEntity(entites.DIALOG)
addEntity(entites.GROUP)
addEntity(entites.CATEGORY)
addEntity(entites.MULTIMEDIA)
addEntity(entites.EXAMPLE)
addEntity(entites.EXAMPLE_PAGINATION);
addEntity(entites.CONFIG);

export const Controllers = tControllers;
export const Entities = tEntities;

export const InitDataPriority: META.BASE_CONTROLLER<any>[] = [
  controllers.ConfigController as any,
  controllers.AuthController as any
]

const project = ENV.workspace.projects.find(p => p.name === 'ss-common-logic')

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
    InitDataPriority
  });
}


//#endregion
