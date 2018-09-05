import { ENDPOINT, CLASSNAME, BaseCRUDEntity, POST, PathParam, QueryParam, GET, Response } from 'morphi';
import { META } from 'baseline/ss-common-logic/src/helpers';
import { BUILD } from '../entities/BUILD';

//#region @backend
import { run, HelpersLinks, getLinesFromFiles } from 'tnp-bundle'
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


  private recreateFolders() {

    if (!fse.existsSync(ENV.pathes.backup.repositories)) {
      fse.mkdirpSync(ENV.pathes.backup.repositories)
    }

    if (!fse.existsSync(ENV.pathes.backup.builds)) {
      fse.mkdirpSync(ENV.pathes.backup.builds)
    }
  }

  private async createFirstBuildFromCurrentTnpProject() {

    const b1 = await this.db.BUILD.save(this.db.BUILD.create({
      gitFolder: '/projects/baseline',
      gitRemote: 'https://github.com/darekf77/tsc-npm-project.git'
    }))

    const tnpLocation = path.resolve(path.join(__dirname, '../../../../../'));
    b1.initialize(tnpLocation);

  }

  async initExampleDbData() {


    this.recreateFolders()
    await this.createFirstBuildFromCurrentTnpProject()


  }
  //#endregion


  @GET('/lines/:id')
  getByIdLastNLines(@PathParam('id') id, @QueryParam('lines') n = 1000): Response<string[]> {
    //#region @backendFunc
    return async () => {
      const build = await this.db.BUILD.findOne(id);
      if (!build) {
        throw `Cannot find build with id ${id}`
      }
      if (!fse.existsSync(build.localPath.buildLog)) {
        throw `Log for build doesn't exist  ${build.localPath.buildLog}`;
      }
      return getLinesFromFiles(build.localPath.buildLog);
    }
    //#endregion
  }


  @POST('/start/:id')
  startById(@PathParam('id') id) {
    //#region @backendFunc
    return async () => {
      const build = await this.db.BUILD.findOne(id);
      if (!build) {
        throw `Cannot find build with id ${id}`
      }
      build.start();
    }
    //#endregion
  }

}

export default BuildController;
