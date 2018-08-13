

import { AuthController } from './controllers/core/AuthController';
export { AuthController } from './controllers/core/AuthController';

import { MultimediaController } from './controllers/core/MultimediaController';
export { MultimediaController } from './controllers/core/MultimediaController';

import { CategoryController } from "./controllers/CategoryController";
export { CategoryController } from "./controllers/CategoryController";

import { GroupsController } from "./controllers/GroupsController";
export { GroupsController } from "./controllers/GroupsController";

import { ExamplesController } from './controllers/ExamplesController';
export { ExamplesController } from './controllers/ExamplesController';

import { EXAMPLE_PAGINATION } from './entities/EXAMPLE_PAGINATION';
export { EXAMPLE_PAGINATION } from './entities/EXAMPLE_PAGINATION';

//#region @backend
import { getSingleton } from "morphi";


export function controllers() {
  return {
    AuthController: getSingleton<AuthController>(AuthController),
    CategoryController: getSingleton<CategoryController>(CategoryController),
    MultimediaController: getSingleton<MultimediaController>(MultimediaController),
    ExamplesController: getSingleton<ExamplesController>(ExamplesController),
    GroupsController: getSingleton<GroupsController>(GroupsController),
    EXAMPLE_PAGINATION: getSingleton<EXAMPLE_PAGINATION>(EXAMPLE_PAGINATION),
  }
}
//#endregion
