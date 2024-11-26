
//#region imports
import { BaseCliWorker, CfontAlign, CfontStyle } from 'tnp-helpers/src';
import {
  _,
  crossPlatformPath,
  //#region @backend
  fse,
  os,
  path,
  Utils,
  //#endregion
} from 'tnp-core/src';
import { BaseContext, Taon } from 'taon/src';
import { Helpers } from 'tnp-helpers/src';
// import type { BaseProject } from './base-project';
// import { config } from 'tnp-config/src';
import { BaseCliWorkerController } from 'tnp-helpers/src';
import { config } from 'tnp-config/src';
import type { TaonProjectResolve } from './project';

//#endregion

//#region port entity
@Taon.Entity({
  className: 'TaonProject',
})
class TaonProject extends Taon.Base.AbstractEntity {
  static from(opt: Omit<TaonProject, 'id' | 'version' | '_' | 'clone'>) {
    return _.merge(new TaonProject(), opt);
  }

  //#region port entity / columns /  serviceId
  //#region @websql
  @Taon.Orm.Column.Custom({
    type: 'varchar',
    length: 150,
    unique: true,
  })
  //#endregion
  location: string;
  //#endregion

  //#region port entity / columns /  serviceId
  //#region @websql
  @Taon.Orm.Column.Custom({
    type: 'varchar',
    length: 150,
  })
  //#endregion
  serviceId: string;
  //#endregion
}
//#endregion

//#region ports controller
@Taon.Controller({
  className: 'TaonProjectsController',
})
class TaonProjectsController extends BaseCliWorkerController<TaonProject> {
  entityClassResolveFn = () => TaonProject;

  //#region methods / init example db data
  async initExampleDbData() {
    //#region @websql
    await this.db.save(
      TaonProject.from({
        location: '/tmp',
        serviceId: 'angular dev server',
      }),
    );
    //#endregion
  }
  //#endregion
}
//#endregion

//#region ports context

//#region @backend
const taonProjectsWorkerDatabaseLocation = crossPlatformPath([
  os.userInfo().homedir,
  `.taon/databases-for-services/taon-projects-worker.sqlite`,
]);
if (!Helpers.exists(path.dirname(taonProjectsWorkerDatabaseLocation))) {
  Helpers.mkdirp(path.dirname(taonProjectsWorkerDatabaseLocation));
}
// console.log('portsWorkerDatabaseLocation', portsWorkerDatabaseLocation);
//#endregion

var TaonProjectsContext = Taon.createContext(() => ({
  contextName: 'TaonProjectsContext',
  contexts: { BaseContext },
  controllers: { TaonProjectsController },
  entities: { TaonProject },
  //#region @backend
  database: {
    location: taonProjectsWorkerDatabaseLocation,
  },
  //#endregion
  logs: {
    // framework: true,
  },
}));
//#endregion

export class TaonProjectsWorker extends BaseCliWorker {
  //#region constructor
  constructor(
    /**
     * unique id for service
     */
    serviceID: string,
    /**
     * external command that will start service
     */
    startCommand: string,
    protected readonly ins: TaonProjectResolve,
  ) {
    super(serviceID, startCommand);
  }
  //#endregion

  //#region methods / get controller for remote connection
  private taonProjectsController: TaonProjectsController | undefined;
  protected async getControllerForRemoteConnection(): Promise<
    BaseCliWorkerController<any>
  > {
    if (this.taonProjectsController) {
      return this.taonProjectsController;
    }
    await this.waitForProcessPortSavedToDisk();
    const refRemote = await TaonProjectsContext.initialize({
      overrideRemoteHost: `http://localhost:${this.processLocalInfoObj.port}`,
    });
    this.taonProjectsController = refRemote.getInstanceBy(
      TaonProjectsController,
    );
    return this.taonProjectsController;
  }
  //#endregion

  //#region methods / start normally in current process
  /**
   * start normally process
   * this will crash if process already started
   */
  async startNormallyInCurrentProcess() {
    //#region @backendFunc
    const port = await this.getServicePort();

    await TaonProjectsContext.initialize({
      overrideHost: `http://localhost:${port}`,
    });

    await this.initializeWorkerMetadata();

    Helpers.info(`Service started !`);
    await this._infoScreen();
    //#endregion
  }
  //#endregion

  //#region methods / header text
  protected async headerText(): Promise<string> {
    return `Taon.dev Projects`;
  }
  //#endregion

  //#region methods / header style
  protected headerStyle(): CfontStyle {
    return 'chrome';
  }
  //#endregion

  //#region methods / header align
  protected headerAlign(): CfontAlign {
    return 'left';
  }
  //#endregion
}
