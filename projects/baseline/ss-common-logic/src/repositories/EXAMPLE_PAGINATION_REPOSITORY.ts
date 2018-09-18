//#region @backend
import { EntityRepository, META } from 'morphi';
import { EXAMPLE_PAGINATION } from '../entities/EXAMPLE_PAGINATION';

export interface EXAMPLE_PAGINATION_ALIASES {

  example: string;
  examples: string;

}

@EntityRepository(EXAMPLE_PAGINATION)
export class EXAMPLE_PAGINATION_REPOSITORY
  extends META.BASE_REPOSITORY<EXAMPLE_PAGINATION, EXAMPLE_PAGINATION_ALIASES> {


  globalAliases: (keyof EXAMPLE_PAGINATION_ALIASES)[] = ['example', 'examples'];


}

//#endregion
