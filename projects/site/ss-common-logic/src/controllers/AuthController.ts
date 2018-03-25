// global
import {
  ENDPOINT
} from 'morphi';
// thirdpart

import { META } from "baseline/ss-common-logic/bundle/helpers";
// controllers
import { AuthController as BaselineAuthController } from "baseline/ss-common-logic/bundle/controllers/AuthController";
// entities
import { EMAIL_TYPE, EMAIL_TYPE_REPOSITORY, EMAIL_TYPE_META } from "baseline/ss-common-logic/bundle/entities/EMAIL_TYPE";
import { EMAIL, EMAIL_REPOSITORY, EMAIL_META } from "baseline/ss-common-logic/bundle/entities/EMAIL";
import { USER, USER_REPOSITORY, USER_META } from "baseline/ss-common-logic/bundle/entities/USER";
import { SESSION, SESSION_CONFIG, SESSION_REPOSITORY, SESSION_META } from '../entities/SESSION';


@ENDPOINT()
export class AuthController extends BaselineAuthController {


  public ENTITIES() {
    return {
      USER: USER_META(this.connection as any),
      SESSION: SESSION_META(this.connection as any),
      EMAIL: EMAIL_META(this.connection as any),
      EMAIL_TYPE: EMAIL_TYPE_META(this.connection as any)
    }
  }

}

export default AuthController;
