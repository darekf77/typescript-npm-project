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
import * as sleep from 'sleep';
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


  private async createSelfBuild() {
    const tnpLocation = path.resolve(path.join(__dirname, '../../../../../'));

    const selfBuild = await this.db.BUILD.save(this.db.BUILD.create({
      gitFolder: '/projects/site',
      gitRemote: 'https://github.com/darekf77/tsc-npm-project.git',
      staticFolder: tnpLocation,
      isSelf: true
    }))

    selfBuild.init(true)
    // await this.db.BUILD.changeEnvironmentBy(b1, 'online');
    await this.saveProject(selfBuild)
    await this.db.BUILD.update(selfBuild.id, selfBuild);

  }

  private async createBuildFromBaseline() {

    const tnpLocation = path.resolve(path.join(__dirname, '../../../../../'));

    const baselineBuild = await this.db.BUILD.save(this.db.BUILD.create({
      gitFolder: '/projects/baseline',
      gitRemote: 'https://github.com/darekf77/tsc-npm-project.git',
      staticFolder: tnpLocation
    }))


    baselineBuild.init()
    // await this.db.BUILD.changeEnvironmentBy(baselineBuild, 'dev');
    await this.saveProject(baselineBuild)
    await this.db.BUILD.update(baselineBuild.id, baselineBuild);


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
    await this.createSelfBuild()
    await this.createBuildFromBaseline()


  }
  //#endregion


  @GET('/environment/:id')

  getEnvironment(@PathParam('id') id: number): Response<entities.ENVIRONMENT> {
    //#region @backendFunc
    return async () => {
      const build = await this.db.BUILD.getById(id);
      let env = {} as any;
      function tryToGenEnvironment() {
        try {
          env = entities.ENVIRONMENT.from(build.project);
        } catch (error) {
          env = {} as any;
          // console.log(`Trying get evironment by id ${id}`)
          // sleep.sleep(1);
          // tryToGenEnvironment();
        }
      }
      tryToGenEnvironment()
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
      let names = []
      function tryAssignNames() {
        try {
          names = entities.ENVIRONMENT.namesFrom(build.project);
        } catch (error) {
          console.log('Trying get evironment names..')
          sleep.sleep(1);
          tryAssignNames();
        }
      }
      tryAssignNames()
      return names;
    }
    //#endregion
  }

}
