//#region @backend
import * as controllers from './controllers';
// import * as entites from './entities';
import { Controllers } from './controllers';
import { Entities } from './entities';

import { Morphi } from 'morphi';


export const InitDataPriority: Morphi.Base.Controller<any>[] = [
  controllers.ConfigController,
  controllers.AuthController,
] as any;

