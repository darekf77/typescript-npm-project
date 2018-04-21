//#region @backend
export * from './controllers';
export * from './entities';

import glob = require('glob')
import path = require('path');

const tControllers = {}
glob.sync(path.join(__dirname, '/controllers/**/*.js'))
  .forEach(function (file) {
    let controller: Function = require(path.resolve(file)).default;
    if (typeof controller === "function") {
      tControllers[controller.name] = controller;
    }
  })

const tEntities = {}
glob.sync(path.join(__dirname, '/entities/**/*.js'))
  .forEach(function (file) {
    let entity: Function = require(path.resolve(file)).default;
    if (typeof entity === "function") {
      tEntities[entity.name] = entity;
    }
  })

export const Controllers = tControllers;
export const Entities = tEntities;
//#endregion
