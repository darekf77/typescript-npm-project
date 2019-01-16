//#region @backend
import { Morphi } from 'morphi';
import { CONFIG } from '../entities/CONFIG';

export interface CONFIG_ALIASES {

  config: string;
  configs: string;

}

@Morphi.Repository(CONFIG)
export class CONFIG_REPOSITORY extends Morphi.Base.Repository<CONFIG, CONFIG_ALIASES> {


  globalAliases: (keyof CONFIG_ALIASES)[] = ['config', 'configs'];


}
//#endregion
