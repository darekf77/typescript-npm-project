//#region @backend
import { getSingleton } from "morphi";

import { AuthController } from './controllers/core/AuthController';
export { AuthController } from './controllers/core/AuthController';

import { DialogController } from "./controllers/DialogController";
export { DialogController } from "./controllers/DialogController";

export function controllers() {
    return {
        AuthController: getSingleton<AuthController>(AuthController),
        DialogController: getSingleton<DialogController>(DialogController)
    }
}
//#endregion