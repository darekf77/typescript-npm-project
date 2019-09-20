import { Morphi } from 'morphi';
import { SUEPR_ASD } from './SUEPR_ASD';

@Morphi.Controller({
  className: 'SueprAsdController',
  entity: SUEPR_ASD,
  //#region @backend
  // auth: () => {
  //   return authenticate('bearer', { session: false });
  // }
  //#endregion
})
export class SueprAsdController extends Morphi.Base.Controller<SUEPR_ASD> {

  //#region @backend
  async initExampleDbData() {

  }
  //#endregion

}
