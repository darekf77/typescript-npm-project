//#region @backend
import { Morphi } from 'morphi';
import { PROCESS } from '../../entities/core/PROCESS';

export interface PROCESS_ALIASES {
  process: string;
  processes: string;

}


@Morphi.Repository(PROCESS)
export class PROCESS_REPOSITORY extends Morphi.Base.Repository<PROCESS, PROCESS_ALIASES> {


  globalAliases: (keyof PROCESS_ALIASES)[] = ['process', 'processes']

}
//#endregion
