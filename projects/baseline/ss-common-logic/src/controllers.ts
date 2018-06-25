

import { AuthController } from './controllers/core/AuthController';
export { AuthController } from './controllers/core/AuthController';

import { MultimediaController } from './controllers/core/MultimediaController';
export { MultimediaController } from './controllers/core/MultimediaController';

import { CategoryController } from "./controllers/CategoryController";
export { CategoryController } from "./controllers/CategoryController";

import { ExamplesController } from './controllers/ExamplesController';
export { ExamplesController } from './controllers/ExamplesController';

//#region @backend
import { getSingleton } from "morphi";


export function controllers() {
  return {
    AuthController: getSingleton<AuthController>(AuthController),
    CategoryController: getSingleton<CategoryController>(CategoryController),
    MultimediaController: getSingleton<MultimediaController>(MultimediaController),
    ExamplesController: getSingleton<ExamplesController>(ExamplesController)
  }
}
//#endregion
