import {
  CategoryController as BaselineCategoryController
} from 'baseline/ss-common-logic/src/controllers/CategoryController';
import { Morphi } from 'morphi';
import { CATEGORY } from 'baseline/ss-common-logic/src/entities';

@Morphi.Controller({
  className: 'CategoryController',
  entity: CATEGORY
})
export class CategoryController extends BaselineCategoryController {

  //#region @backend
  async initExampleDbData() {
    // console.log('Don not init this! OK ')
  }
  //#endregion

}
