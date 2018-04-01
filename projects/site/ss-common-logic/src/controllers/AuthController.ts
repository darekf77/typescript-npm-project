// global
import {
  ENDPOINT
} from 'morphi';
// thirdpart

import { META } from "baseline-ss-common-logic/helpers";
// controllers
import { AuthController as BaselineAuthController } from "baseline-ss-common-logic/controllers/AuthController";

//#region entities
import { EMAIL_TYPE_DECORATOR, EMAIL_TYPE_NAME, EMAIL_TYPE_REPOSITORY } from '../entities/EMAIL_TYPE';
import { EMAIL_DECORATOR, EMAIL_REPOSITORY } from '../entities/EMAIL';
import { USER_DECORATOR, USER_REPOSITORY, IUSER } from '../entities/USER';
import { SESSION_DECORATOR, SESSION_CONFIG, SESSION_REPOSITORY } from '../entities/SESSION';
//#endregion

import { entities } from '../entities';

@ENDPOINT()
export class AuthControllerDecorator extends BaselineAuthController {


  public get ENTITIES() {
    return entities(this.connection as any) as any;
  }


}

export default AuthControllerDecorator;
