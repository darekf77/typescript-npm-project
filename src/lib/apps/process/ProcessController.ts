//#region imports
import { Morphi } from 'morphi';
import { Project } from 'tnp-helpers';
import { PROGRESS_DATA } from 'tnp-models';
import { PROCESS } from './PROCESS';
//#region @backend
import { authenticate } from 'passport';
import * as  psList from 'ps-list';
import { _, crossPlatformPath } from 'tnp-core';
import { path } from 'tnp-core';
import { rimraf } from 'tnp-core';
import { config } from 'tnp-config';
//#endregion
//#endregion

@Morphi.Controller({
  //#region controller options
  className: 'ProcessController',
  entity: PROCESS,
  //#region @backend
  // auth: () => {
  //   return authenticate('bearer', { session: false });
  // }
  //#endregion
  //#endregion
})
export class ProcessController extends Morphi.Base.Controller<PROCESS> {

  //#region start

  @Morphi.Http.GET('/start/:id')
  start(
    @Morphi.Http.Param.Path('id') id: number,
    @Morphi.Http.Param.Query('config') config?: Morphi.CRUD.ModelDataConfig,
    @Morphi.Http.Param.Query('parameters') parameters?: Object,
  ): Morphi.Response<PROCESS> {
    //#region @backendFunc
    return async () => {
      const { model: proc } = await PROCESS.db.getBy(id);
      if (_.isObject(parameters) && !_.isArray(parameters)) {
        proc.parameters = parameters;
        console.log(`[process] Parameters are set ${parameters}`);
      } else {
        console.log(`[process] Parameters is not a object ${parameters}`);
      }
      const res = await proc.start();
      res.modelDataConfig = config as any;
      return () => res;
    };
    //#endregion
  }
  //#endregion

  //#region stop
  @Morphi.Http.GET('/stop/:id')
  stop(
    @Morphi.Http.Param.Path('id') id: number,
    @Morphi.Http.Param.Query('config') config?: Morphi.CRUD.ModelDataConfig
  ): Morphi.Response<PROCESS> {
    //#region @backendFunc
    return async () => {
      const { model: proc } = await PROCESS.db.getBy(id);
      const res = await proc.stop();
      res.modelDataConfig = config as any;
      return () => res;
    };
    //#endregion
  }
  //#endregion

  //#region progress message
  @Morphi.Http.GET('/progress/:id')
  progressMessages(
    @Morphi.Http.Param.Path('id') id: number,
    @Morphi.Http.Param.Query('alreadyInFE') alreadyInFE: number = 0): Morphi.Response<PROGRESS_DATA[]> {

    //#region @backendFunc
    return async () => {
      const { model: proc } = await PROCESS.db.getBy(id);
      const res = await proc.start();
      return () => res.allProgressData.slice(alreadyInFE);
    };
    //#endregion
  }
  //#endregion

  //#region get all
  @Morphi.Http.GET()
  getAll(@Morphi.Http.Param.Query('config') config?: Morphi.CRUD.ModelDataConfig): Morphi.Response<PROCESS[]> {
    //#region @backendFunc
    return async (req, res) => {
      const s = super.getAll(config);
      const processes = await Morphi.getResponseValue(s, req, res) as PROCESS[];
      await PROCESS.updateActive(processes);
      processes.forEach(p => p.modelDataConfig = config);
      return () => processes;
    };
    //#endregion
  }
  //#endregion

  //#region get by
  @Morphi.Http.GET()
  getBy(
    @Morphi.Http.Param.Path('id') id: number,
    @Morphi.Http.Param.Query('config') config?: Morphi.CRUD.ModelDataConfig
  ): Morphi.Response<PROCESS> {
    //#region @backendFunc
    return async (req, res) => {
      const s = super.getBy(id, config);
      const process = await Morphi.getResponseValue(s, req, res) as PROCESS;
      await PROCESS.updateActive(process);
      process.modelDataConfig = config;
      return () => process;
    };
    //#endregion
  }
  //#endregion

  //#region example
  @Morphi.Http.GET()
  example(): Morphi.Response<any> {
    //#region @backendFunc
    return () => {

      const p = Project.Tnp;

      // const d:any = { dupa: 'dupa' };
      return (() => p) as any;
    };
    //#endregion
  }
  //#endregion

  //#region init example data
  //#region @backend
  async initExampleDbData() {
    PROCESS.removeProcesesfolder();
    await PROCESS.db.bulkCreate([
      new PROCESS({
        name: 'Test async', cmd: `${config.frameworkName} test:async:proc --max 1 `,
        cwd: crossPlatformPath(process.cwd()), async: true
      }),
      new PROCESS({
        name: 'Test sync error', cmd: `${config.frameworkName} show:loop --max 2 --err`,
        cwd: crossPlatformPath(process.cwd())
      }),
      new PROCESS({
        name: 'Messages sync', cmd: `${config.frameworkName} show:loop:messages --max 6`,
        cwd: crossPlatformPath(process.cwd())
      }),
      new PROCESS({
        name: 'Messages async', cmd: `${config.frameworkName} show:loop:messages`,
        cwd: crossPlatformPath(process.cwd()), async: true
      }),
      new PROCESS({
        name: 'Test sync proc', cmd: 'echo "siema"',
        cwd: crossPlatformPath(process.cwd())
      }),
    ]);
  }
  //#endregion
  //#endregion
}
