import { ENDPOINT, OrmConnection, Connection, BaseCRUDEntity, GET, PathParam, Response } from 'morphi';
//#region @backend
import { authenticate } from 'passport';
import * as fs from 'fs';
import * as path from 'path';
//#endregion
// local
import { META } from '../helpers';

import * as entities from '../entities';
import * as controllers from '../controllers';


@ENDPOINT({
  auth: (method) => {
    //#region @backendFunc
    return authenticate('bearer', { session: false });
    //#endregion
  }
})
export class CategoryController extends META.BASE_CONTROLLER<entities.CATEGORY> {

  //#region @backend
  @OrmConnection connection: Connection;

  @BaseCRUDEntity(entities.CATEGORY) public entity: entities.CATEGORY;

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

      categories.forEach(category => {
        categoriesPromises.push(this.db.CATEGORY.save(category))
        category.groups && category.groups.forEach(group => {
          groupsPromises.push(this.db.GROUP.save(group))
          group.dialogs && group.dialogs.forEach(dialog => {
            dialogsPromies.push(this.db.DIALOG.save(dialog))
          })
        })
      })

      await Promise.all(dialogsPromies);    
      // await Promise.all(groupsPromises);
      // await Promise.all(categoriesPromises)

    } catch (e) {
      console.log(`Error while reading database.json`);
      console.log(e);
      process.exit(0)
    }


  }
  //#endregion


  @GET('/Allcategories')
  allCategories(): Response<entities.CATEGORY[]> {
    //#region @backendFunc
    const self = this;
    return async () => {
      const catergoires = await this.db.CATEGORY
        .createQueryBuilder(META.tableNameFrom(entities.CATEGORY))
        .leftJoinAndSelect(`${META.tableNameFrom(entities.CATEGORY)}.dialogs`, 'dialogs')
        .getMany()

      return catergoires;
    };
    //#endregion
  }

}

export default CategoryController;
