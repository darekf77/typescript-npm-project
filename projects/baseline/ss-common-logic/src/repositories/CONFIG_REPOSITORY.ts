//#region @backend
import { EntityRepository, META } from 'morphi';
import { CONFIG } from '../entities/CONFIG';

export interface CONFIG_ALIASES {

  config: string;
  configs: string;

}

@EntityRepository(CONFIG)
export class CONFIG_REPOSITORY extends META.BASE_REPOSITORY<CONFIG, CONFIG_ALIASES> {


  globalAliases: (keyof CONFIG_ALIASES)[] = ['config', 'configs'];


}
//#endregion
