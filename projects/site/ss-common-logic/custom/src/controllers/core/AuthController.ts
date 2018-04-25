import {
  AuthController as BaselineAuthController,
  //#region @backend
  Handler,
  HttpResponse,
  //#endregion
  IFacebook, IHelloJS
} from "baseline/ss-common-logic/src/controllers/core/AuthController";
import { ENDPOINT } from "morphi";

export {
  //#region @backend
  Handler,
  HttpResponse,
  //#endregion
  IFacebook, IHelloJS
} from "baseline/ss-common-logic/src/controllers/core/AuthController";

//#region @backend
import { authenticate, use } from 'passport';
//#endregion

export function amazing() {

}

@ENDPOINT({
  auth: (method) => {
    //#region @backendFunc
    if (method === AuthController.prototype.login) {
      return;
    }
    if (method === AuthController.prototype.checkExist) {
      return;
    }
    return authenticate('bearer', { session: false });
    //#endregion
  }
})
export class AuthController extends BaselineAuthController {



}


export default AuthController;
