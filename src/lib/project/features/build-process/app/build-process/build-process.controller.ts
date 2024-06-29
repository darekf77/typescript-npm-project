//#region imports
//#region @websql
import { Project } from '../../../../abstract/project';
//#endregion
import { Firedev } from 'firedev/src';
import { BuildProcess } from './build-process';
import { _ } from 'tnp-core/src';
import { PortUtils } from '../../../../../constants';
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
  //#endregion
})
export class BuildProcessController extends Firedev.Base.CrudController<any> {
  entityClassResolveFn = () => BuildProcess;

  @Firedev.Http.GET({ path: '/', pathIsGlobal: true })
  main(): Firedev.Response<string> {
    return async (req, res) => {
      return `

      backend port: ${this.project?.backendPort || '< resolving in progress >'} <br>
      currentPorts.NORMAL_APP ${this.project?.standaloneNormalAppPort || '< resolving in progress >'} <br>
      currentPorts.WEBSQL_APP ${this.project?.standaloneWebsqlAppPort || '< resolving in progress >'} <br>

      `;
    };
  }

  private project: Project;
  async initialize(project: Project) {
    this.project = project;
  }
}
