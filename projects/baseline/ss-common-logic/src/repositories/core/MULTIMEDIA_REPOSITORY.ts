//#region @backend
import { MULTIMEDIA } from '../../entities/core/MULTIMEDIA';
import { EntityRepository, META } from 'morphi';

export interface MULTIMEDIA_ALIASES {

  picture: string;
  audio: string;
  video: string;

}


@EntityRepository(MULTIMEDIA)
export class MULTIMEDIA_REPOSITORY extends META.BASE_REPOSITORY<MULTIMEDIA, MULTIMEDIA_ALIASES> {


  globalAliases: (keyof MULTIMEDIA_ALIASES)[] = ['audio', 'video', 'picture']



}
//#endregion
