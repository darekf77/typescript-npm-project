
import { Morphi } from 'morphi';
import { RS_CORE_AUTH } from './RS_CORE_AUTH';

@Morphi.Controller({
  className: 'RsCoreAuthController',
  entity: RS_CORE_AUTH,
  //#region @backend
  // auth: () => {
  //   return authenticate('bearer', { session: false });
  // }
  //#endregion
})
export class RsCoreAuthController extends Morphi.Base.Controller<RS_CORE_AUTH> {

  //#region @backend
  async initExampleDbData() {

  }
  //#endregion

}
