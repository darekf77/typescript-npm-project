//#region @backend
import { fse, UtilsTerminal } from 'tnp-core/src';
//#endregion
import { BaseCliWorker, Helpers } from 'tnp-helpers/src';
import { TaonProjectResolve } from '../project';
import { TaonProjectsController } from './taon.controller';
import { TaonProjectsContext } from './taon.context';
import { config } from 'tnp-config/src';

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
    super(serviceID, startCommand, '0.0.0');
  }
  //#endregion

  //#region methods / get controller for remote connection
  private taonProjectsController: TaonProjectsController | undefined;
  async getControllerForRemoteConnection() {
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
  async startNormallyInCurrentProcess(options?: {
    healthCheckRequestTrys?: number;
  }) {
    //#region @backendFunc
    await this.ins.portsWorker.startDetachedIfNeedsToBeStarted({
      useCurrentWindowForDetach: true,
    });

    options = options || {};
    await this.preventStartIfAlreadyStarted();
    const port = await this.getServicePort();

    await TaonProjectsContext.initialize({
      overrideHost: `http://localhost:${port}`,
    });

    await this.initializeWorkerMetadata();

    Helpers.info(`Service started !`);
    this.preventExternalConfigChange();
    await this.infoScreen();
    //#endregion
  }
  //#endregion

  //#region methods / header text
  protected async headerText(): Promise<string> {
    return 'Taon.dev';
  }
  //#endregion

  //#region methods / header
  protected async header(): Promise<void> {
    //#region @backendFunc
    // return super.header();
    const consoleLogoPath = this.ins
      .by('container', config.defaultFrameworkVersion)
      .pathFor('../../__images/logo/logo-console.png');

    // console.log({ logoLight });
    const pngStringify = require('console-png');
    // consolePng.attachTo(console);
    const image = fse.readFileSync(consoleLogoPath);
    return new Promise((resolve, reject) => {
      pngStringify(image, function (err, string) {
        if (err) {
          throw err;
        }
        console.log(string);
        resolve();
      });
    });
    //#endregion
  }
  //#endregion

  //#region methods / get worker terminal actions
  getWorkerTerminalActions() {
    //#region @backendFunc

    return {
      ...this.chooseAction,
      previewPorts: {
        name: 'Show Environments builds',
        action: async () => {
          console.log('hello world');
          const ctrl = await this.getControllerForRemoteConnection();
          const list = (await ctrl.getEnvironments().received)?.body.json || [];
          await UtilsTerminal.previewLongList(
            list.map(s => `${s.name} ${s.type}`),
          );
          await UtilsTerminal.pressAnyKeyToContinueAsync();
        },
      },
      tcpUdPorts: {
        name: 'Manage TCP/UDP ports',
        action: async () => {
          await this.ins.portsWorker.infoScreen({ exitIsOnlyReturn: true });
        },
      },
      ...super.getWorkerTerminalActions({ chooseAction: false }),
    };
    //#endregion
  }
  //#endregion
}
