//#region @backend
import { Morphi } from 'morphi';
import { EXAMPLE_PAGINATION } from '../entities/EXAMPLE_PAGINATION';

export interface EXAMPLE_PAGINATION_ALIASES {

  example: string;
  examples: string;

}

@Morphi.Repository()
export class EXAMPLE_PAGINATION_REPOSITORY
  extends Morphi.Base.Repository<EXAMPLE_PAGINATION, EXAMPLE_PAGINATION_ALIASES> {


  globalAliases: (keyof EXAMPLE_PAGINATION_ALIASES)[] = ['example', 'examples'];


}

//#endregion
