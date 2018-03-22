// global
import {
  ENDPOINT
} from 'morphi';
// thirdpart
import { AuthController as BaselineAuthController } from "baseline/ss-common-logic/bundle/controllers/AuthController";
import { META_INFO_ENTITY } from "baseline/ss-common-logic/bundle/helpers/entity";
import { EMAIL_TYPE, EMAIL_TYPE_REPOSITORY } from "baseline/ss-common-logic/bundle/entities/EMAIL_TYPE";
import { EMAIL, EMAIL_REPOSITORY } from "baseline/ss-common-logic/bundle/entities/EMAIL";
import { USER, USER_REPOSITORY } from "baseline/ss-common-logic/bundle/entities/USER";
import { SESSION as BASELINE_SESSION, SESSION_CONFIG, SESSION_REPOSITORY } from "baseline/ss-common-logic/bundle/entities/SESSION";
import { getMeta } from "baseline/ss-common-logic/src/helpers/";
import { SESSION } from '../entities/SESSION';


@ENDPOINT()
export class AuthController extends BaselineAuthController {

  get ENTITIES() {
    const config = super.getEntities()
    config.SESSION = getMeta(this.connection, SESSION);
    return config;
  }

}

export default AuthController;
