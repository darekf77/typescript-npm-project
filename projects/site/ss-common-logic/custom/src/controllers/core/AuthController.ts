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
import { BaselineSiteJoin } from "tnp";
//#endregion


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


  constructor() {
    super()
    //#region @backend

    this.isBaselineFile = BaselineSiteJoin.PathHelper.isBaselineParent(__filename);
    console.log('isBaselineParent from site: ', this.isBaselineFile)
    //#endregion
  }

}


export default AuthController;
