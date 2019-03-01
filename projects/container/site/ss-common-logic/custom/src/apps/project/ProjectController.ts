import { Morphi } from 'morphi';
import * as _ from 'lodash';

import * as entities from '../../entities';
import * as controllers from '../../controllers';
import { PROJECT } from './PROJECT';
import { ProjectIsomorphicLib, Project } from 'tnp-bundle';
//#region @backend
import { TnpDB, ProjectFrom } from 'tnp-bundle';
//#endregion

export interface IProjectController extends ProjectController {

}

@Morphi.Controller({
  className: 'ProjectController',
  entity: entities.PROJECT,
  additionalEntities: [ProjectIsomorphicLib, Project]
})
export class ProjectController extends Morphi.Base.Controller<entities.PROJECT> {


  @Morphi.Http.GET()
  getAll(
    @Morphi.Http.Param.Query('config') config?: Morphi.CRUD.ModelDataConfig,
    @Morphi.Http.Param.Query('slice') slice: number = 1)
    : Morphi.Response<PROJECT[]> {
    //#region @backendFunc
    return async () => {
      const db = await TnpDB.Instance;
      const projects = db.getProject();
      const mapped = projects.map(p => {
        let res = p.project;
        res.modelDataConfig = config;
        return res as any;
      });
      return mapped;
    }
    //#endregion
  }


  getByLocation(
    location: string,
    config?: Morphi.CRUD.ModelDataConfig) {
    return this._getByLocation(location, config);
  }

  @Morphi.Http.GET('/location/:location')
  private _getByLocation(
    @Morphi.Http.Param.Path('location') location: string,
    @Morphi.Http.Param.Query('config') config?: Morphi.CRUD.ModelDataConfig)
    : Morphi.Response<PROJECT> {
    //#region @backendFunc
    return async () => {
      let res = ProjectFrom(decodeURIComponent(location));
      res.modelDataConfig = config;
      return res as any;
    }
    //#endregion
  }

  //#region @backend

  get db() {
    return entities.entities(this.connection as any)
  }

  get ctrl() {
    return controllers.controllers()
  }

  async initExampleDbData() {
    // console.log('Don not init this! OK ')

  }
  //#endregion


}
