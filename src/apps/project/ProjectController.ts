//#region isomorphic
import { _ } from 'tnp-core';
import { Morphi, MDC } from 'morphi';
import { PROJECT } from './PROJECT';
import { Models } from 'tnp-models';
import { ConfigModels } from 'tnp-config';
//#endregion

@Morphi.Controller({
  className: 'ProjectController',
  entity: PROJECT
})
export class ProjectController extends Morphi.Base.Controller<PROJECT> {

  @Morphi.Http.GET()
  public getAll(
    @Morphi.Http.Param.Header(Morphi.MDC_KEY) configCrud?: Morphi.CRUD.ModelDataConfig)
    : Morphi.Response<PROJECT[]> {
    //#region @backendFunc
    return async () => {
      const res = await PROJECT.getAllProjects()
      return () => res;
    }
    //#endregion
  }

  @Morphi.Http.GET()
  public getAllStandalone()
    : Morphi.Response<PROJECT[]> {
    //#region @backendFunc
    return async (req: any, res) => {
      req.headers[Morphi.MDC_KEY] = MDC.create({ include: ['name'] }).toString()
      const menuPorojects = await PROJECT.getAllProjects() as PROJECT[];
      return () => menuPorojects.filter(f => !f || !f.isGenerated);
    }
    //#endregion
  }

  public getByLocation(
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
      req.headers[Morphi.MDC_KEY] = configCrud.toString()
      const res = await PROJECT.getByLocation(decodeURIComponent(location)) as PROJECT;
      return () => res;
    }
    //#endregion
  }


  @Morphi.Http.GET('/environments/:location')
  public getEnvironments(@Morphi.Http.Param.Path('location') location: string)
    : Morphi.Response<ConfigModels.EnvironmentName[]> {
    //#region @backendFunc
    return async (req) => {
      location = decodeURIComponent(location);
      const proj = await PROJECT.getByLocation(location);
      return !proj ? [] : proj.namesFrom();
    }
    //#endregion
  }

  //#region @backend
  async initExampleDbData() {
    // console.log('Don not init this! OK ')
    // const db = await TnpDB.Instance();
    // await db.resetProcessess() // TODO WHAT THE FuCK
    console.log('Ininting projects !');
  }
  //#endregion


}
