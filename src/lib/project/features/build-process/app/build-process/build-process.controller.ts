//#region imports
import { Morphi as Firedev } from 'morphi/src';
import { BuildProcess } from './build-process';
import { _ } from 'tnp-core/src';
import {
  randUserName,
  randAddress,
} from '@ngneat/falso'; // faking data
import { IBuildProcess } from './build-process.models';
//#region @websql
import { BUILD_PROCESS } from './build-process.models';
import { BuildProcessBackend } from './backend/build-process-backend';
import type { BuildProcessFeature } from '../../build-proces.backend';
import { Project } from '../../../../abstract/project';
import { DEFAULT_PORT } from '../../../../../constants';

//#endregion
//#endregion

const currentPorts = {
  NORMAL_APP: void 0 as number,
  WEBSQL_APP: void 0 as number,
};

/**
 * Isomorphic Controller for BuildProcess
 *
 * + only create here isomorphic controller methods
 * + use this.backend for any backend/db operations
 */
@Firedev.Controller({
  //#region controller options
  className: 'BuildProcessController',
  entity: BuildProcess,
  //#endregion
})
export class BuildProcessController extends Firedev.Base.Controller<any> {
  //#region fields
  entity: typeof BuildProcess;
  //#region @websql
  readonly backend = BuildProcessBackend.for(this);
  //#endregion
  //#endregion

  @Firedev.Http.GET({ path: '/', pathIsGlobal: true })
  main(): Firedev.Response<string> {
    return async (req, res) => {
      return 'hello world from firedev';
    }
  }

  @Firedev.Http.POST()
  getPortFor(@Firedev.Http.Param.Query('appType') appType: 'websql' | 'normal'): Firedev.Response<number> {
    return async (req, res) => {
      if (appType === 'normal') {
        if (_.isUndefined(currentPorts.NORMAL_APP)) {
          currentPorts.NORMAL_APP = await this.project.assignFreePort(DEFAULT_PORT.APP_BUILD_LOCALHOST);
        }
        return currentPorts.NORMAL_APP;
      }
      if (appType === 'websql') {
        if (_.isUndefined(currentPorts.WEBSQL_APP)) {
          currentPorts.WEBSQL_APP = await this.project.assignFreePort(DEFAULT_PORT.APP_BUILD_LOCALHOST);
        }
        return currentPorts.WEBSQL_APP
      }
      console.log('RETURN NOTHING')
    }
  };

  private readonly project: Project;
  async initialize(project: Project) {
    // @ts-ignore
    this.project = project;
  }

}
