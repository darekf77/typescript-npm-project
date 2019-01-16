//#region @backend
import * as controllers from './controllers';
// import * as entites from './entities';
export { Controllers } from './controllers';
export { Entities } from './entities';


import { Morphi } from 'morphi';

//#region @backend
export const InitDataPriority: Morphi.Base.Controller<any>[] = [
  controllers.ConfigController,
  controllers.AuthController,
] as any;
//#endregion

