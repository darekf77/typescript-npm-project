import {
  AuthController as BaselineAuthController
} from 'baseline/ss-common-logic/src/controllers/core/AuthController';
import { Morphi } from 'morphi';

export {
  //#region @backend
  Handler,
  //#endregion
  IFacebook, IHelloJS
} from 'baseline/ss-common-logic/src/controllers/core/AuthController';

//#region @backend
import { authenticate, use } from 'passport';
//#endregion

import { SESSION } from 'baseline/ss-common-logic/src/entities/core/SESSION';

@Morphi.Controller({
  className: 'AuthController',
  entity: SESSION, // TODO it is not working as expected , NOT NECESSARY ???
  //#region @backend
  auth: (method) => {
    if (method === AuthController.prototype.login) {
      return;
    }
    if (method === AuthController.prototype.checkExist) {
      return;
    }
    return authenticate('bearer', { session: false });
  }
  //#endregion
})
export class AuthController extends BaselineAuthController {
  // constructor() {
  //   super()
  //   //#region @backend
  //   this.__init();
  //   //#endregion
  // }

  // public async __mocks() {
  //   await super.__mocks()
  //   await this.__createUser({
  //     username: 'site',
  //     email: 'site@site.pl',
  //     password: 'site'
  //   }, 'normal_auth');
  // }

}

