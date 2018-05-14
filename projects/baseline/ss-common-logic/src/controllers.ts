

import { AuthController } from './controllers/core/AuthController';
export { AuthController } from './controllers/core/AuthController';

import { MultimediaController } from './controllers/core/MultimediaController';
export { MultimediaController } from './controllers/core/MultimediaController';

import { CategoryController } from "./controllers/CategoryController";
export { CategoryController } from "./controllers/CategoryController";

//#region @backend
import { getSingleton } from "morphi";

export function controllers() {
  return {
    AuthController: getSingleton<AuthController>(AuthController),
    CategoryController: getSingleton<CategoryController>(CategoryController),
    MultimediaController: getSingleton<MultimediaController>(MultimediaController)
  }
}
//#endregion
