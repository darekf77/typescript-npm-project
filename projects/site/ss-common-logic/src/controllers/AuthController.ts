// global
import {
  ENDPOINT
} from 'morphi';
// thirdpart
import { AuthController as BaselineAuthController } from "baseline/ss-common-logic/bundle/controllers/AuthController";
import { EMAIL_TYPE, EMAIL_TYPE_REPOSITORY } from "baseline/ss-common-logic/bundle/entities/EMAIL_TYPE";
import { EMAIL, EMAIL_REPOSITORY } from "baseline/ss-common-logic/bundle/entities/EMAIL";
import { USER, USER_REPOSITORY } from "baseline/ss-common-logic/bundle/entities/USER";
import { SESSION as BASELINE_SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from "baseline/ss-common-logic/bundle/entities/SESSION";
import { META } from "baseline/ss-common-logic/bundle/helpers";
import { SESSION } from '../entities/SESSION';


@ENDPOINT()
export class AuthController extends BaselineAuthController {

  get ENTITIES() {
    const config = super._ENTITIES();
    config.SESSION = META.get(this.connection, SESSION);
    return config;
  }

}

export default AuthController;
