// global
import {
  ENDPOINT
} from 'morphi';
// thirdpart
import { AuthController } from "baseline/ss-common-logic/src/controllers/AuthController";


@ENDPOINT()
export class AuthControllerExtended extends AuthController {

}

export default AuthController;
