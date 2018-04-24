//#region @backend
import * as c from './controllers';
import * as e from './entities';
export * from './controllers';
export * from './entities';

import glob = require('glob')
import path = require('path');
import { controllers } from './controllers';

const tControllers = {}
const tEntities = {}

function addController(controller: Function) {
  tControllers[controller.name] = controller;
}

function addEntity(entity: Function) {
  tEntities[entity.name] = entity;
}


addController(c.AuthController)
addController(c.DialogController)

addEntity(e.EMAIL)
addEntity(e.EMAIL_TYPE)
addEntity(e.USER)
addEntity(e.SESSION)
addEntity(e.DIALOG)
addEntity(e.CATEGORY)

export const Controllers = tControllers;
export const Entities = tEntities;
//#endregion
