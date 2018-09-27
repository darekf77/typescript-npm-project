import {
  ENDPOINT, CLASSNAME, BaseCRUDEntity, META,
  POST, PathParam, QueryParam, GET, Response, PUT, ModelDataConfig
} from 'morphi';
import { BUILD } from '../entities/BUILD';
import * as _ from 'lodash';
import { EnvironmentName } from 'tnp-bundle'
//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
//#endregion

import * as entities from '../entities';
import * as controllers from '../controllers';

@ENDPOINT()
@CLASSNAME('BuildController')
export class BuildController extends META.BASE_CONTROLLER<BUILD> {

  @BaseCRUDEntity(entities.BUILD) public entity: entities.BUILD;
  //#region @backend

  get db() {
    return entities.entities(this.connection as any)
  }

  get ctrl() {
    return controllers.controllers()
  }


  private async saveProject(build: BUILD) {
    if (build.project) {
      if (build.project.children) {
        for (let i = 0; i < build.project.children.length; i++) {
          const child = build.project.children[i];
          await this.db.TNP_PROJECT.save(child);
        }
      }
      await this.db.TNP_PROJECT.save(build.project);
    }
  }

  private async createFirstBuildFromCurrentTnpProject() {

    const tnpLocation = path.resolve(path.join(__dirname, '../../../../../'));

    const b1 = await this.db.BUILD.save(this.db.BUILD.create({
      gitFolder: '/projects/baseline',
      gitRemote: 'https://github.com/darekf77/tsc-npm-project.git',
      staticFolder: tnpLocation
    }))


    b1.init()
    await this.db.BUILD.changeEnvironmentBy(b1, 'dev');
    await this.saveProject(b1)
    await this.db.BUILD.update(b1.id, b1);


    // const b2 = await this.db.BUILD.save(this.db.BUILD.create({
    //   gitFolder: '/projects/workspace',
    //   gitRemote: 'https://github.com/darekf77/tsc-npm-project.git',
    //   staticFolder: tnpLocation
    // }))

    // b2.init()
    // await this.saveProject(b2)
    // await this.db.BUILD.update(b2.id, b2);

  }

  async initExampleDbData() {


    this.db.BUILD.recreateFolders()
    await this.createFirstBuildFromCurrentTnpProject()


  }
  //#endregion


  @GET('/environment/:id')

  getEnvironment(@PathParam('id') id: number): Response<entities.ENVIRONMENT> {
    //#region @backendFunc
    return async () => {
      const build = await this.db.BUILD.getById(id);
      const env = entities.ENVIRONMENT.from(build.project);
      return env;
    }
    //#endregion
  }

  @PUT('/change/build/:id/env/:envname')
  changeEnvironment(@PathParam('id') id: number, @PathParam('envname') envname: EnvironmentName): Response<BUILD> {
    //#region @backendFunc
    return async () => {
      await this.db.BUILD.changeEnvironmentBy(id, envname);
      return await this.db.BUILD.getById(id);
    }
    //#endregion
  }


  @GET('/environment/names/:id')
  getEnvironmentNames(@PathParam('id') id: number): Response<EnvironmentName[]> {
    //#region @backendFunc
    return async () => {
      const build = await this.db.BUILD.getById(id);
      const names = entities.ENVIRONMENT.namesFrom(build.project);
      return names;
    }
    //#endregion
  }

}
