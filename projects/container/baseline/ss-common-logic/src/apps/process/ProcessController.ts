
import { Morphi } from 'morphi';

//#region @backend
import { authenticate } from 'passport'
import * as  psList from 'ps-list';
import * as _ from 'lodash';
import { Project } from 'tnp-bundle'
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as fse from 'fs-extra';
//#endregion

import { PROGRESS_DATA } from 'tnp-bundle'
import * as entities from '../../entities';
import * as controllers from '../../controllers';
import { PROCESS } from './PROCESS';


export interface IProcessController extends ProcessController { }


@Morphi.Controller({
  className: 'ProcessController',
  entity: entities.PROCESS,
  //#region @backend
  // auth: () => {
  //   return authenticate('bearer', { session: false });
  // }
  //#endregion
})
export class ProcessController extends Morphi.Base.Controller<entities.PROCESS> {


  @Morphi.Http.GET('/start/:id')
  start(@Morphi.Http.Param.Path('id') id: number, @Morphi.Http.Param.Query('config') config?: Morphi.CRUD.ModelDataConfig): Morphi.Response<PROCESS> {
    //#region @backendFunc
    return async () => {
      let res = await this.db.PROCESS.start(await this.db.PROCESS.findOne(id));
      res.modelDataConfig = config as any;
      return () => res;
    }
    //#endregion
  }

  @Morphi.Http.GET('/stop/:id')
  stop(@Morphi.Http.Param.Path('id') id: number, @Morphi.Http.Param.Query('config') config?: Morphi.CRUD.ModelDataConfig): Morphi.Response<PROCESS> {
    //#region @backendFunc
    return async () => {
      let res = await this.db.PROCESS.stop(await this.db.PROCESS.findOne(id));
      res.modelDataConfig = config as any;
      return () => res;
    }
    //#endregion

  }

  @Morphi.Http.GET('/progress/:id')
  progressMessages(
    @Morphi.Http.Param.Path('id') id: number,
    @Morphi.Http.Param.Query('alreadyInFE') alreadyInFE: number = 0): Morphi.Response<PROGRESS_DATA[]> {

    //#region @backendFunc
    return async () => {
      let res = await this.db.PROCESS.start(await this.db.PROCESS.findOne(id));
      return () => res.allProgressData.slice(alreadyInFE)
    }
    //#endregion
  }


  @Morphi.Http.GET()
  getAll(@Morphi.Http.Param.Query('config') config?: Morphi.CRUD.ModelDataConfig): Morphi.Response<PROCESS[]> {
    //#region @backendFunc
    return async (req, res) => {
      const s = super.getAll(config)
      const processes = await Morphi.getResponseValue(s, req, res) as PROCESS[];
      await this.db.PROCESS.updateActive(processes)
      processes.forEach(p => p.modelDataConfig = config)
      return () => processes;
    }
    //#endregion
  }

  @Morphi.Http.GET()
  getBy(@Morphi.Http.Param.Path('id') id: number, @Morphi.Http.Param.Query('config') config?: Morphi.CRUD.ModelDataConfig): Morphi.Response<PROCESS> {
    //#region @backendFunc
    return async (req, res) => {
      const s = super.getBy(id, config)
      const process = await Morphi.getResponseValue(s, req, res) as PROCESS;
      await this.db.PROCESS.updateActive(process);
      process.modelDataConfig = config;
      return () => process;
    }
    //#endregion
  }


  //#region @backend
  get ctrl() {
    return controllers.controllers()
  }

  get db() {
    // @ts-ignore
    return entities.entities(this.connection as any);
  }



  private removeProcesesfolder() {
    const folder = path.join(Project.Tnp.location, 'tmp-processes-logs');
    if (fse.existsSync(folder)) {
      rimraf.sync(folder)
    }
  }

  async initExampleDbData() {
    this.removeProcesesfolder()

    // await this.db.PROCESS.save(new PROCESS({ name: 'Test async', cmd: 'tnp test:async:proc --max 1 ', cwd: process.cwd(), async: true }))
    // await this.db.PROCESS.save(new PROCESS({ name: 'Test sync error', cmd: 'tnp show:loop --max 2 --err', cwd: process.cwd() }))
    await this.db.PROCESS.save(new PROCESS({ name: 'Messages sync', cmd: 'tnp show:loop:messages --max 6', cwd: process.cwd() }))
    await this.db.PROCESS.save(new PROCESS({ name: 'Messages async', cmd: 'tnp show:loop:messages', cwd: process.cwd(), async: true }))
    // await this.db.PROCESS.save(new PROCESS({ name: 'Test sync proc', cmd: 'echo "siema"', cwd: process.cwd() }))
  }

  //#endregion

}
