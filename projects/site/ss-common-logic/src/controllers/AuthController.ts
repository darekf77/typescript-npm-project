// global
import {
  ENDPOINT
} from 'morphi';
// thirdpart
import { AuthController as BaselineAuthController } from "baseline/ss-common-logic/bundle/controllers/AuthController";
import { ENTITIES } from '../entities';

@ENDPOINT()
export class AuthController extends BaselineAuthController {

  get ENTITIES() {
    return ENTITIES();
  }

}

export default AuthController;
