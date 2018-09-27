//#region @backend
import { EntityRepository, META } from 'morphi';
import { PROGRESS_BAR_DATA } from '../entities/PROGRESS_BAR_DATA';

export interface PROGRESS_BAR_DATA_ALIASES {

  progresses: string;
  progress: string;

}


@EntityRepository(PROGRESS_BAR_DATA)
export class PROGRESS_BAR_DATA_REPOSITORY extends META.BASE_REPOSITORY<PROGRESS_BAR_DATA, PROGRESS_BAR_DATA_ALIASES> {


  globalAliases: (keyof PROGRESS_BAR_DATA_ALIASES)[] = ['progress', 'progresses'];


}
//#endregion
