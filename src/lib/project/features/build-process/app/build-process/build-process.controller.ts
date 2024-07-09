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

  @Firedev.Http.GET()
  getPorts(): Firedev.Response<BuildProcess> {
    return async (req, res) => {
      return this.db.findOne({});
    };
  }

  private project: Project;
  async initializeServer(project: Project) {
    this.project = project;
    const portsToSave = {
      backendPort: this.project.backendPort,
      standaloneNormalAppPort: this.project.standaloneNormalAppPort,
      standaloneWebsqlAppPort: this.project.standaloneWebsqlAppPort,
    };
    console.log(portsToSave);
    await this.db.save(new BuildProcess().clone(portsToSave));
  }

  async initializeClientToRemoteServer(project: Project) {
    this.project = project;
    const { backendPort, standaloneNormalAppPort, standaloneWebsqlAppPort } = (
      await this.getPorts().received
    ).body.json;
    const ports = {
      backendPort,
      standaloneNormalAppPort,
      standaloneWebsqlAppPort,
    };
    console.log('ports from remote db', ports);
    Object.assign(project, ports);
    // @LAST TODO app should request portss from remote server
  }
}
