import { ENDPOINT, OrmConnection, Connection, BaseCRUDEntity, GET, PathParam, Response } from 'morphi';
import { authenticate } from 'passport';
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

    let c1d1 = new entities.DIALOG()
    c1d1.name = 'Introduction'


    let c1d2 = new entities.DIALOG()
    c1d2.name = 'Say hellooo!'


    const c1 = new entities.CATEGORY()
    c1.name = 'COFFE SHOP'
    c1.dialogs.push(c1d1)
    c1.dialogs.push(c1d2)
    c1d1.category = c1;
    c1d2.category = c1;
    c1d1 = await this.db.DIALOG.save(c1d1)
    c1d2 = await this.db.DIALOG.save(c1d2)
    await this.db.CATEGORY.save(c1)


    // const c2d1 = new entities.DIALOG()
    // c2d1.name = 'Picku introduction'
    // await this.db.DIALOG.save(c2d1)

    // const c2 = new entities.CATEGORY()
    // c2.name = 'STREET'
    // c2.dialogs.push(c2d1)
    // await this.db.CATEGORY.save(c2)
  }

  //#endregion

  @GET('/Allcategories')
  allCategories(): Response<entities.CATEGORY[]> {
    //#region @backendFunc
    const self = this;
    return async () => {
      const catergoires = await this.db.CATEGORY.find()
      return catergoires;
    };
    //#endregion
  }

}

export default CategoryController;
