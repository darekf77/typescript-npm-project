// global
import {
  ENDPOINT
} from 'morphi';
// thirdpart

import { META } from "baseline/ss-common-logic/bundle/helpers";
// controllers
import { AuthController as BaselineAuthController } from "baseline/ss-common-logic/bundle/controllers/AuthController";

//#region entities
import { EMAIL_TYPE, EMAIL_TYPE_NAME, EMAIL_TYPE_REPOSITORY } from '../entities/EMAIL_TYPE';
import { EMAIL, EMAIL_REPOSITORY } from '../entities/EMAIL';
import { USER, USER_REPOSITORY, IUSER } from '../entities/USER';
import { SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from '../entities/SESSION';
//#endregion

import { entities } from '../entities';

@ENDPOINT()
export class AuthController extends BaselineAuthController {


  public get ENTITIES() {
    return entities(this.connection as any);
  }


}

export default AuthController;
