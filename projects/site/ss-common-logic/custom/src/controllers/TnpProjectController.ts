import {
  CategoryController as BaselineCategoryController,

} from 'baseline/ss-common-logic/src/controllers/CategoryController';
import {
  GET, PUT, POST, PathParam, Response, QueryParam,
  ENDPOINT, CLASSNAME, BaseCRUDEntity, META, DELETE
} from 'morphi';

//#region @backend
import * as fse from 'fs-extra';
import * as sleep from 'sleep';
//#endregion

import * as entities from '../entities';
import * as controllers from '../controllers';
import { PROGRESS_BAR_DATA, EnvironmentName } from 'tnp-bundle';
import { SelfUpdate, TNP_PROJECT } from '../entities/TNP_PROJECT';
import { Subject } from 'rxjs/Subject';




@ENDPOINT()
@CLASSNAME('TnpProjectController')
export class TnpProjectController extends META.BASE_CONTROLLER<entities.TNP_PROJECT> {


  @BaseCRUDEntity(entities.TNP_PROJECT) public entity: entities.TNP_PROJECT;


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
      const project = await this.db.TNP_PROJECT.getById(id);
      if (type === 'build') {
        if (!fse.existsSync(project.buildlogFilePath)) {
          throw `Log for build doesn't exist  ${project.buildlogFilePath}`;
        }

        return this.cutLast(fse.readFileSync(project.buildlogFilePath).toString(), lines);
      } else if (type === 'serve') {
        if (!fse.existsSync(project.servelogFilePath)) {
          throw `Log for build doesn't exist  ${project.servelogFilePath}`;
        }

        return this.cutLast(fse.readFileSync(project.servelogFilePath).toString(), lines);
      }

    }
    //#endregion
  }

  @GET('/lines/error/log/:id')
  getByIdErrorLog(@PathParam('id') id, @QueryParam('type') type: 'build' | 'serve', @QueryParam('lines') lines = 1000): Response<string[]> {
    //#region @backendFunc
    return async () => {
      const project = await this.db.TNP_PROJECT.getById(id);
      if (type === 'build') {
        if (!fse.existsSync(project.buildErrorslogFilePath)) {
          throw `Error Log for build doesn't exist  ${project.buildErrorslogFilePath}`;
        }

        return this.cutLast(fse.readFileSync(project.buildErrorslogFilePath).toString(), lines);
      } else if (type === 'serve') {
        if (!fse.existsSync(project.serverErrorslogFilePath)) {
          throw `Error Log for serve doesn't exist  ${project.serverErrorslogFilePath}`;
        }

        return this.cutLast(fse.readFileSync(project.serverErrorslogFilePath).toString(), lines);
      }

    }
    //#endregion
  }


  @PUT('/clear/:id')
  clearById(@PathParam('id') id: number, @QueryParam('all') all = false): Response<void> {
    //#region @backendFunc
    return async () => {
      await this.db.TNP_PROJECT.clearById(id, all);
    }
    //#endregion
  }

  @PUT('/start/build/:id')
  startBuildById(@PathParam('id') id: number): Response<void> {
    //#region @backendFunc
    return async () => {
      await this.db.TNP_PROJECT.start.buildingById(id);
    }
    //#endregion
  }

  @PUT('/stop/build/:id')
  stopBuildById(@PathParam('id') id: number): Response<void> {
    //#region @backendFunc
    return async () => {
      await this.db.TNP_PROJECT.stop.buildingById(id);
    }
    //#endregion
  }

  @PUT('/start/serve/:id')
  startServeById(@PathParam('id') id: number): Response<void> {
    //#region @backendFunc
    return async () => {
      await this.db.TNP_PROJECT.start.servingById(id)
    }
    //#endregion
  }

  @PUT('/stop/serve/:id')
  stopServeById(@PathParam('id') id: number): Response<void> {
    //#region @backendFunc
    return async () => {
      await this.db.TNP_PROJECT.stop.serveingById(id);
    }
    //#endregion
  }

  @POST('/selfupdate')
  selfupdateStart(@QueryParam('child') child?: string): Response<void> {
    //#region @backendFunc
    return async () => {
      await this.db.TNP_PROJECT.selfupdate.begin(child)
    }
    //#endregion
  }

  @GET('/selfupdate')
  selfupdateStatus(@QueryParam('waitForAnswer') waitForAnswer: boolean = false): Response<SelfUpdate> {
    //#region @backendFunc
    return async () => {
      let res = await this.db.TNP_PROJECT.selfupdate.status(waitForAnswer)
      return res as any;
    }
    //#endregion
  }


  @GET('/environment/:id')

  getEnvironment(@PathParam('id') id: number): Response<entities.ENVIRONMENT> {
    //#region @backendFunc
    return async () => {
      const project = await this.db.TNP_PROJECT.getById(id)
      let env = {} as any;
      function tryToGenEnvironment() {
        try {
          env = entities.ENVIRONMENT.from(project);
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
  changeEnvironment(@PathParam('id') id: number, @PathParam('envname') envname: EnvironmentName): Response<TNP_PROJECT> {
    //#region @backendFunc
    return async () => {
      await this.db.TNP_PROJECT.changeEnvironmentBy(id, envname);
      return await this.db.TNP_PROJECT.getById(id);
    }
    //#endregion
  }


  @GET('/environment/names/:id')
  getEnvironmentNames(@PathParam('id') id: number): Response<EnvironmentName[]> {
    //#region @backendFunc
    return async () => {
      const project = await this.db.TNP_PROJECT.getById(id);
      let names = []
      function tryAssignNames() {
        try {
          names = entities.ENVIRONMENT.namesFrom(project);
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


// let m = new TNP_PROJECT()
// let d = new TnpProjectController(undefined);

// let ext = d.browser.extended(m)
// ext.getEnvironmentNames()
