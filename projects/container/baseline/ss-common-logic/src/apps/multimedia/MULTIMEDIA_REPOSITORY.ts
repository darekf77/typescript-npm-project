//#region @backend
import { MULTIMEDIA } from './MULTIMEDIA';
import { Morphi } from 'morphi';

export interface MULTIMEDIA_ALIASES {

  picture: string;
  audio: string;
  video: string;

}


@Morphi.Repository(MULTIMEDIA)
export class MULTIMEDIA_REPOSITORY extends Morphi.Base.Repository<MULTIMEDIA, MULTIMEDIA_ALIASES> {


  globalAliases: (keyof MULTIMEDIA_ALIASES)[] = ['audio', 'video', 'picture']



}
//#endregion
