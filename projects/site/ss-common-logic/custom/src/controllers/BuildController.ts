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

  constructor() {
    super(
      //#region @backend
      {
        // afterUpdate: (e) => {
        //   console.log('after update', e)
        // },
        // afterInsert: (e) => {
        //   // console.log('after insert!', e)
        // }
      }
      //#endregion
    )
  }

  @BaseCRUDEntity(entities.BUILD) public entity: entities.BUILD;
  //#region @backend

  get db() {
    return entities.entities(this.connection as any)
  }

  get ctrl() {
    return controllers.controllers()
  }


  private recreateFolders() {

    if (!fse.existsSync(ENV.pathes.backup.repositories)) {
      fse.mkdirpSync(ENV.pathes.backup.repositories)
    }

    if (!fse.existsSync(ENV.pathes.backup.builds)) {
      fse.mkdirpSync(ENV.pathes.backup.builds)
    }
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


    this.recreateFolders()
    await this.createFirstBuildFromCurrentTnpProject()


  }
  //#endregion


  cutLast(s: string, nLines: number) {
    const lines = s.split('\n')

    return ((lines.length - nLines) <= 0) ? lines : lines.slice(lines.length - nLines, lines.length)
  }



  /**
   *
   * @param lines undefied value means "get whole log"
   */
  @GET('/lines/log/:id')
  getByIdLog(@PathParam('id') id, @QueryParam('type') type: 'build' | 'serve', @QueryParam('lines') lines = 1000): Response<string[]> {
    //#region @backendFunc
    return async () => {
      const build = await this.db.BUILD.getById(id);
      if (type === 'build') {
        if (!fse.existsSync(build.localPath.buildLog)) {
          throw `Log for build doesn't exist  ${build.localPath.buildLog}`;
        }

        return this.cutLast(fse.readFileSync(build.localPath.buildLog).toString(), lines);
      } else if (type === 'serve') {
        if (!fse.existsSync(build.localPath.serveLog)) {
          throw `Log for build doesn't exist  ${build.localPath.serveLog}`;
        }

        return this.cutLast(fse.readFileSync(build.localPath.serveLog).toString(), lines);
      }

    }
    //#endregion
  }


  @PUT('/clear/:id')
  clearById(@PathParam('id') id: number, @QueryParam('all') all = false): Response<void> {
    //#region @backendFunc
    return async () => {
      await this.db.BUILD.clearById(id, all);
    }
    //#endregion
  }

  @PUT('/start/build/:id')
  startBuildById(@PathParam('id') id: number): Response<void> {
    //#region @backendFunc
    return async () => {
      await this.db.BUILD.start.buildingById(id);
    }
    //#endregion
  }

  @PUT('/stop/build/:id')
  stopBuildById(@PathParam('id') id: number): Response<void> {
    //#region @backendFunc
    return async () => {
      await this.db.BUILD.stop.buildingById(id);
    }
    //#endregion
  }

  @PUT('/start/serve/:id')
  startServeById(@PathParam('id') id: number): Response<void> {
    //#region @backendFunc
    return async () => {
      await this.db.BUILD.start.servingById(id)
    }
    //#endregion
  }

  @PUT('/stop/serve/:id')
  stopServeById(@PathParam('id') id: number): Response<void> {
    //#region @backendFunc
    return async () => {
      await this.db.BUILD.stop.serveingById(id);
    }
    //#endregion
  }

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

export default BuildController;
