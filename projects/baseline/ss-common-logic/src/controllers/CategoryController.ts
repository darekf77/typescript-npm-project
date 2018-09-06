import {
  ENDPOINT, OrmConnection, Connection,
  BaseCRUDEntity,
  GET, SYMBOL,
  PathParam,
  Response, CLASSNAME, POST, BodyParam
} from 'morphi';
//#region @backend
import { authenticate } from 'passport';
import * as fs from 'fs';
import * as path from 'path';
//#endregion
// local
import { META } from '../helpers';

import * as entities from '../entities';
import * as controllers from '../controllers';
import { CATEGORY } from '../entities/CATEGORY';


@ENDPOINT({
  auth: (method) => {
    //#region @backendFunc
    return authenticate('bearer', { session: false });
    //#endregion
  }
})
@CLASSNAME('CategoryController')
export class CategoryController extends META.BASE_CONTROLLER<entities.CATEGORY> {

  @BaseCRUDEntity(entities.CATEGORY) public entity: entities.CATEGORY;

  //#region @backend
  @OrmConnection connection: Connection;

  get db() {
    return entities.entities(this.connection as any);
  }

  get ctrl() {
    return controllers.controllers()
  }


  async initExampleDbData() {

    const pathDatabaseJSON = path.join(__dirname, '../../database.json')

    let json: {
      categories: entities.ICATEGORY[]
    } = {} as any;

    try {
      json = JSON.parse(fs.readFileSync(pathDatabaseJSON, 'utf8').toString())

      const categories: entities.CATEGORY[] = json.categories.map(c => {
        let category = new entities.CATEGORY()
        return category.fromRaw(c);
      })

      const categoriesPromises = []
      const groupsPromises = []
      const dialogsPromies = []

      let groups: entities.GROUP[] = [];
      let dialogs: entities.DIALOG[] = [];

      categories.forEach(category => {
        categoriesPromises.push(this.db.CATEGORY.save(category))
        groups = groups.concat(category.groups);
        category.groups = []
      })

      await Promise.all(categoriesPromises)

      groups.forEach(group => {
        groupsPromises.push(this.db.GROUP.save(group))
        dialogs = dialogs.concat(group.dialogs);
        group.dialogs = [];
      })

      await Promise.all(groupsPromises);


      dialogs.forEach(dialog => {
        dialogsPromies.push(this.db.DIALOG.save(dialog))
      })

      await Promise.all(dialogsPromies);



    } catch (e) {
      console.log(`Error while reading database.json`);
      console.log(e);
      process.exit(0)
    }
    console.log('json', json)

  }
  //#endregion


  // @GET(`/${SYMBOL.}`)
  // updateById() {

  // }


  @GET('/allCategories')
  allCategoriesWithAllData(): Response<entities.CATEGORY[]> {
    //#region @backendFunc
    const self = this;
    return async () => {

      // this.db.DIALOG._.dialogs

      const catergoires = await this.db.CATEGORY
        .createQueryBuilder(this.db.CATEGORY._.category)
        .innerJoinAndSelect(this.db.CATEGORY.__.category.groups, this.db.GROUP._.groups)
        .innerJoinAndSelect(this.db.GROUP.__.groups.dialogs, this.db.DIALOG._.dialogs)
        .getMany()

      return catergoires;
    };
    //#endregion
  }


  @GET('/categories')
  allCategories(): Response<entities.CATEGORY[]> {
    //#region @backendFunc
    const self = this;
    return async () => {
      const catergoires = await this.db.CATEGORY.find()
      return catergoires;
    };
    //#endregion
  }

  @GET('/categories/:id')
  categoryBy(@PathParam('id') id: number): Response<entities.CATEGORY> {
    //#region @backendFunc
    const self = this;
    return async () => {

      const category = await this.db.CATEGORY
        .createQueryBuilder(this.db.CATEGORY._.category)
        .innerJoinAndSelect(this.db.CATEGORY.__.category.groups, this.db.GROUP._.groups)
        .innerJoinAndSelect(this.db.GROUP.__.groups.dialogs, this.db.DIALOG._.dialogs)
        .where(`${this.db.CATEGORY.__.category.id}=:id`, { id })
        .getOne()
      return category;
    };
    //#endregion
  }

  // @POST('/:id')
  // categoryUpdate(@BodyParam() categor: CATEGORY) {


  //   return async () => {

  //   }
  // }


}


export default CategoryController;
