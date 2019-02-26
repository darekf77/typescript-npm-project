//#region @backend
import { Morphi } from 'morphi';
import { CATEGORY } from './CATEGORY';

export interface CATEGORY_ALIASES {

  categories: string;
  category: string;

}


@Morphi.Repository(CATEGORY)
export class CATEGORY_REPOSITORY extends Morphi.Base.Repository<CATEGORY, CATEGORY_ALIASES> {


  globalAliases: (keyof CATEGORY_ALIASES)[] = ['category', 'categories']

}
//#endregion
