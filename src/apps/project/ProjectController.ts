import { Morphi, MDC } from 'morphi';
import * as _ from 'lodash';

import type { PROJECT } from './PROJECT';
import { Models } from 'tnp-models';
import { Project } from '../../project/abstract/project';
//#region @backend
import { TnpDB } from 'tnp-db';
//#endregion

export interface IProjectController extends ProjectController { }

@Morphi.Controller({
  className: 'ProjectController',
  additionalEntities: [Project]
})
export class ProjectController extends Morphi.Base.Controller<PROJECT> {


  @Morphi.Http.GET()
  getAll(
    @Morphi.Http.Param.Header(Morphi.MDC_KEY) configCrud?: Morphi.CRUD.ModelDataConfig)
    : Morphi.Response<PROJECT[]> {
    //#region @backendFunc
    return async () => {
      return [];
      // const res = await this.db.PROJECT.getAllProjects()
      // return () => res;
    }
    //#endregion
  }

  @Morphi.Http.GET()
  getAllStandalone()
    : Morphi.Response<PROJECT[]> {
    //#region @backendFunc
    return async (req: any, res) => {
      return [];
      // req.headers[Morphi.MDC_KEY] = MDC.create({ include: ['name'] }).toString()
      // const menuPorojects = await this.db.PROJECT.getAllProjects() as PROJECT[];
      // return () => menuPorojects.filter(f => !f || !f.isGenerated);
    }
    //#endregion
  }


  getByLocation(
    location: string) {
    const config = MDC.create({
      exclude: ['children', 'parent']
    });
    return this._getByLocation(encodeURIComponent(location), config);
  }


  @Morphi.Http.GET('/location/:location')
  private _getByLocation(
    @Morphi.Http.Param.Path('location') location: string,
    @Morphi.Http.Param.Header(Morphi.MDC_KEY) configCrud?: Morphi.CRUD.ModelDataConfig)
    : Morphi.Response<PROJECT> {
    //#region @backendFunc
    return async (req: any) => {
      // req.headers[Morphi.MDC_KEY] = configCrud.toString()
      // const res = await this.db.PROJECT.getByLocation(decodeURIComponent(location)) as PROJECT;
      return () => void 0;
    }
    //#endregion
  }


  public getEnvironments(location: string) {
    return this._getEnvironments(encodeURIComponent(location))
  }


  @Morphi.Http.GET('/environments/:location')
  private _getEnvironments(@Morphi.Http.Param.Path('location') location: string)
    : Morphi.Response<Models.env.EnvironmentName[]> {
    //#region @backendFunc
    return async (req) => {
      return [];
      // location = decodeURIComponent(location);
      // return this.db.PROJECT.namesFrom(await this.db.PROJECT.getByLocation(location))
    }
    //#endregion
  }

  //#region @backend


  async initExampleDbData() {
    // console.log('Don not init this! OK ')
    // const db = await TnpDB.Instance();
    // await db.resetProcessess() // TODO WHAT THE FuCK
    console.log('Done clearing processes');
  }
  //#endregion


}
