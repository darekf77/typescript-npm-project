//#region imports
import { Firedev } from 'firedev/src';
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
import { Project } from '../../../../abstract/project';

//#endregion
//#endregion

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
      return `


      currentPorts.NORMAL_APP ${this.project.__standaloneNormalAppPort} <br>
      currentPorts.WEBSQL_APP ${this.project.__standaloneWebsqlAppPort} <br>

      `;
    }
  }

  private project: Project;
  async initialize(project: Project) {
    this.project = project;
  }

}
