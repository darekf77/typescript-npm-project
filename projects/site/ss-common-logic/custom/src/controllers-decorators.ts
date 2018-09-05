

import { BuildController } from './controllers/BuildController';
export { BuildController } from './controllers/BuildController';

//#region @backend
import * as _ from 'lodash';
import { getSingleton } from "morphi";



export function controllers() {
  return {
    BuildController: getSingleton<BuildController>(BuildController)
  }
}


//#endregion
