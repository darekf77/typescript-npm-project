import {
  CategoryController as BaselineCategoryController,

} from 'baseline/ss-common-logic/src/controllers/CategoryController';
import { ENDPOINT, CLASSNAME } from 'morphi';

@ENDPOINT()
@CLASSNAME('CategoryController')
export class CategoryController extends BaselineCategoryController {

  //#region @backend
  async initExampleDbData() {
    // console.log('Don not init this! OK ')
  }
  //#endregion

}
