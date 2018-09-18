//#region @backend
import { EntityRepository, META } from 'morphi';
import { CATEGORY } from '../entities/CATEGORY';

export interface CATEGORY_ALIASES {

  categories: string;
  category: string;

}


@EntityRepository(CATEGORY)
export class CATEGORY_REPOSITORY extends META.BASE_REPOSITORY<CATEGORY, CATEGORY_ALIASES> {


  globalAliases: (keyof CATEGORY_ALIASES)[] = ['category', 'categories']

}
//#endregion
