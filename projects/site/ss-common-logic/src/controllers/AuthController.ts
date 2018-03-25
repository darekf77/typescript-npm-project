// global
import {
  ENDPOINT
} from 'morphi';
// thirdpart
import { AuthController as BaselineAuthController } from "baseline/ss-common-logic/bundle/controllers/AuthController";
import { EMAIL_TYPE, EMAIL_TYPE_REPOSITORY } from "baseline/ss-common-logic/bundle/entities/EMAIL_TYPE";
import { EMAIL, EMAIL_REPOSITORY } from "baseline/ss-common-logic/bundle/entities/EMAIL";
import { USER, USER_REPOSITORY } from "baseline/ss-common-logic/bundle/entities/USER";
import {
  SESSION as BASELINE_SESSION,
  SESSION_CONFIG as BASELINE_SESSION_CONFIG,
  SESSION_REPOSITORY as BASELINE_SESSION_REPOSITORY
} from "baseline/ss-common-logic/bundle/entities/SESSION";

import { META } from "baseline/ss-common-logic/bundle/helpers";
import { SESSION, SESSION_CONFIG, SESSION_REPOSITORY, SESSION_META } from '../entities/SESSION';


@ENDPOINT()
export class AuthController extends BaselineAuthController {

  ENTITIES() {
    const config = super.ENTITIES();
    config.SESSION = SESSION_META(this.connection as any);
    return config;
  }

}

export default AuthController;
