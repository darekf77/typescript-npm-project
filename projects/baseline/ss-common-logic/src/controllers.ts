

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

import { DialogsController } from './controllers/DialogsController';
export { DialogsController } from './controllers/DialogsController';

import { ConfigController } from './controllers/ConfigController';
export { ConfigController } from './controllers/ConfigController';

import { ExamplesPaginationController } from './controllers/ExamplesPaginationController';
export { ExamplesPaginationController } from './controllers/ExamplesPaginationController';



//#region @backend
import { getSingleton } from "morphi";


export function controllers() {
  return {
    AuthController: getSingleton<AuthController>(AuthController),
    CategoryController: getSingleton<CategoryController>(CategoryController),
    MultimediaController: getSingleton<MultimediaController>(MultimediaController),
    ExamplesController: getSingleton<ExamplesController>(ExamplesController),
    GroupsController: getSingleton<GroupsController>(GroupsController),
    DialogsController: getSingleton<DialogsController>(DialogsController),
    ConfigController: getSingleton<ConfigController>(ConfigController),
    ExamplesPaginationController: getSingleton<ExamplesPaginationController>(ExamplesPaginationController)
  }
}
//#endregion
