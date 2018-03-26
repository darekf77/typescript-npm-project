// global
import {
  ENDPOINT
} from 'morphi';
// thirdpart

import { META } from "baseline/ss-common-logic/bundle/helpers";
// controllers
import { AuthController as BaselineAuthController } from "baseline/ss-common-logic/bundle/controllers/AuthController";
//#region entities
import { EMAIL_TYPE, EMAIL_TYPE_REPOSITORY, } from "baseline/ss-common-logic/bundle/entities/EMAIL_TYPE";
import { EMAIL, EMAIL_REPOSITORY } from "baseline/ss-common-logic/bundle/entities/EMAIL";
import { USER, USER_REPOSITORY, } from "baseline/ss-common-logic/bundle/entities/USER";
// overrided
import { SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from '../entities/SESSION';
//#endregion
import { entities } from '../entities';

@ENDPOINT()
export class AuthController extends BaselineAuthController {


  public get ENTITIES() {
    return entities(this.connection);
  }


}

export default AuthController;
