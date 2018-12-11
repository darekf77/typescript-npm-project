//#region @backend
import { Morphi } from 'morphi';
import { EXAMPLE } from '../entities/EXAMPLE';

export interface EXAMPLE_ALIASES {

  example: string;
  examples: string;

}


@Morphi.Repository()
export class EXAMPLE_REPOSITORY extends Morphi.Base.Repository<EXAMPLE, EXAMPLE_ALIASES> {


  globalAliases: (keyof EXAMPLE_ALIASES)[] = ['example', 'examples'];


}

//#endregion
