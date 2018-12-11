import { Morphi } from 'morphi';


//#region @backend
import * as fs from 'fs';
import * as path from 'path';
//#endregion


import * as entities from '../entities';
import * as controllers from '../controllers';


@Morphi.Controller({
  className: 'CategoryController',
  //#region @backend
  auth: (method) => {
    return Morphi.Auth('bearer', { session: false });
  }
  //#endregion
})
export class CategoryController extends Morphi.Base.Controller<entities.CATEGORY> {

  @Morphi.Base.InjectCRUDEntity(entities.CATEGORY) public entity: entities.CATEGORY;

  //#region @backend
  @Morphi.Orm.InjectConnection connection: Morphi.Orm.Connection;

  get db() {
    // @ts-ignore
    return entities.entities(this.connection as any);
  }

  // @ts-ignore
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


  @Morphi.Http.GET('/allCategories')
  allCategoriesWithAllData(): Morphi.Response<entities.CATEGORY[]> {
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


  @Morphi.Http.GET('/categories')
  allCategories(): Morphi.Response<entities.CATEGORY[]> {
    //#region @backendFunc
    const self = this;
    return async () => {
      const catergoires = await this.db.CATEGORY.find()
      return catergoires;
    };
    //#endregion
  }

  @Morphi.Http.GET('/categories/:id')
  categoryBy(@Morphi.Http.Param.Path('id') id: number): Morphi.Response<entities.CATEGORY> {
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

