import {
  CategoryController as BaselineCategoryController,

} from 'baseline/ss-common-logic/src/controllers/CategoryController';
import { ENDPOINT } from 'morphi';

@ENDPOINT()
export class CategoryController extends BaselineCategoryController {


  async initExampleDbData() {
    console.log('Don not init this! OK ')
  }

}

export default CategoryController;
