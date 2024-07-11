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
      const all = await this.db.find();
      return _.first(all);
    };
  }

  private project: Project;
  async initializeServer(project: Project) {
    this.project = project;
    this.project.standaloneNormalAppPort = this.resolve_standaloneNormalAppPort;
    this.project.standaloneWebsqlAppPort = this.resolve_standaloneWebsqlAppPort;
    const portsToSave = {
      backendPort: this.project.backendPort,
      standaloneNormalAppPort: this.project.standaloneNormalAppPort,
      standaloneWebsqlAppPort: this.project.standaloneWebsqlAppPort,
    };
    await this.db.save(new BuildProcess().clone(portsToSave));
  }

  async initializeClientToRemoteServer(project: Project) {
    this.project = project;
    const { backendPort, standaloneNormalAppPort, standaloneWebsqlAppPort } = (
      await this.getPorts().received
    ).body.json;
    project.backendPort = backendPort;
    project.standaloneNormalAppPort = standaloneNormalAppPort;
    project.standaloneWebsqlAppPort = standaloneWebsqlAppPort;
  }

  //#region getters & methods / set project info
  private get resolve_projectInfoPort() {
    //#region @backendFunc
    if (!this.project) {
      return void 0;
    }
    let port = this.project.projectInfoPort;
    if (!port && this.project.__isSmartContainerTarget) {
      return this.project.__smartContainerTargetParentContainer
        ?.projectInfoPort;
    }
    return port;
    //#endregion
  }
  //#endregion

  //#region getters & methods / get standalone normal app port
  private get resolve_standaloneNormalAppPort() {
    //#region @backendFunc
    if (!this.project) {
      return void 0;
    }
    const resolvePort = PortUtils.instance(
      this.resolve_projectInfoPort,
    ).calculateClientPortFor(this.project, { websql: false });
    // console.log(`resolveStandaloneNormalAppPort ${resolvePort}`);
    return resolvePort;
    //#endregion
  }
  //#endregion

  //#region getters & methods / get standalone websql app port
  private get resolve_standaloneWebsqlAppPort() {
    //#region @backendFunc
    if (!this.project) {
      return void 0;
    }
    const resolvePort = PortUtils.instance(
      this.resolve_projectInfoPort,
    ).calculateClientPortFor(this.project, { websql: true });
    return resolvePort;
    //#endregion
  }
  //#endregion
}
