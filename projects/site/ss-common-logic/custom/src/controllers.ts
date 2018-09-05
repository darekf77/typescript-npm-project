import * as controllersBaseline from 'baseline/ss-common-logic/src/controllers';
export * from 'baseline/ss-common-logic/src/controllers';

import { BuildController } from './controllers/BuildController';
export { BuildController } from './controllers/BuildController';

//#region @backend
import * as _ from 'lodash';
import { getSingleton } from "morphi";


export function controllers() {
  return _.merge(controllersBaseline.controllers(), {

    BuildController: getSingleton<BuildController>(BuildController)

  });
}


//#endregion
