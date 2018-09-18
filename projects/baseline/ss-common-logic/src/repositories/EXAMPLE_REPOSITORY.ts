//#region @backend
import { EntityRepository, META } from 'morphi';
import { EXAMPLE } from '../entities/EXAMPLE';

export interface EXAMPLE_ALIASES {

  example: string;
  examples: string;

}


@EntityRepository(EXAMPLE)
export class EXAMPLE_REPOSITORY extends META.BASE_REPOSITORY<EXAMPLE, EXAMPLE_ALIASES> {


  globalAliases: (keyof EXAMPLE_ALIASES)[] = ['example', 'examples'];


}

//#endregion
