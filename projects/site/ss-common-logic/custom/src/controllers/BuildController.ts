import { ENDPOINT, CLASSNAME, BaseCRUDEntity, POST, PathParam, QueryParam, GET, Response, PUT } from 'morphi';
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


  cutLast(s: string, nLines: number) {
    const lines = s.split('\n')

    return ((lines.length - nLines) <= 0) ? lines : lines.slice(lines.length - nLines, lines.length)
  }



  @GET('/lines/build/:id')
  getByIdLastNLinesFromBuildLog(@PathParam('id') id, @QueryParam('lines') n = 1000): Response<string[]> {
    //#region @backendFunc
    return async () => {
      const build = await this.db.BUILD.getById(id);

      if (!fse.existsSync(build.localPath.buildLog)) {
        throw `Log for build doesn't exist  ${build.localPath.buildLog}`;
      }

      return this.cutLast(fse.readFileSync(build.localPath.buildLog).toString(), n);
    }
    //#endregion
  }

  @GET('/lines/serve/:id')
  getByIdLastNLinesFromServeLog(@PathParam('id') id, @QueryParam('lines') n = 1000): Response<string[]> {
    //#region @backendFunc
    return async () => {
      const build = await this.db.BUILD.getById(id);
      if (!fse.existsSync(build.localPath.serveLog)) {
        throw `Log for build doesn't exist  ${build.localPath.serveLog}`;
      }

      return this.cutLast(fse.readFileSync(build.localPath.serveLog).toString(), n);
    }
    //#endregion
  }

  @PUT('/clear/:id')
  clearById(@PathParam('id') id: number, @QueryParam('all') all = false): Response<void> {
    //#region @backendFunc
    return async () => {
      const build = await this.db.BUILD.getById(id);
      build.clear();
    }
    //#endregion
  }

  @PUT('/start/build/:id')
  startBuildById(@PathParam('id') id: number): Response<void> {
    //#region @backendFunc
    return async () => {
      const build = await this.db.BUILD.getById(id);
      const p = build.start.building();
      p.on('exit', async () => {
        build.pidBuildProces = null;
        await this.db.BUILD.update(id, build);
      })
      await this.db.BUILD.update(id, build);

    }
    //#endregion
  }

  @PUT('/stop/build/:id')
  stopBuildById(@PathParam('id') id: number): Response<void> {
    //#region @backendFunc
    return async () => {
      const build = await this.db.BUILD.getById(id);
      build.stop.building();
      await this.db.BUILD.update(id, build);

    }
    //#endregion
  }

  @PUT('/start/serve/:id')
  startServeById(@PathParam('id') id: number): Response<void> {
    //#region @backendFunc
    return async () => {
      const build = await this.db.BUILD.getById(id);
      const p = build.start.serving();
      p.on('exit', async () => {
        build.pidServeProces = null;
        await this.db.BUILD.update(id, build);
      })
      await this.db.BUILD.update(id, build);

    }
    //#endregion
  }

  @PUT('/stop/serve/:id')
  stopServeById(@PathParam('id') id: number): Response<void> {
    //#region @backendFunc
    return async () => {
      const build = await this.db.BUILD.getById(id);
      build.stop.serveing();
      await this.db.BUILD.update(id, build);

    }
    //#endregion
  }

}

export default BuildController;
