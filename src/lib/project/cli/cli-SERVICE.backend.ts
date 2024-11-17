import { _, child_process } from 'tnp-core/src';
import { Helpers, UtilsTerminal } from 'tnp-helpers/src';
import { CommandLineFeature } from 'tnp-helpers/src';
import { Project } from '../abstract/project';
import { BuildOptions } from '../../build-options';
import { config } from 'tnp-config/src';
import { Taon, BaseContext } from 'taon/src';
import { fse, chalk } from 'tnp-core/src';
import { UtilsProcess } from 'tnp-core/src';
import { CLASS } from 'typescript-class-helpers/src';

@Taon.Entity({
  className: 'Port',
  // createTable: false,
})
class Port extends Taon.Base.AbstractEntity {
  static from(opt: Omit<Port, 'id' | 'version' | '_' | 'clone'>) {
    return _.merge(new Port(), opt);
  }

  //#region @websql
  @Taon.Orm.Column.Custom({
    type: 'int',
    unique: true,
  })
  //#endregion
  port: number;

  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  type:
    | 'in-use-by-os-or-other-apps'
    | 'taon-process-alive'
    | 'taon-process-unknown-state'
    | 'free-to-use';

  //#region @websql
  @Taon.Orm.Column.Custom({
    type: 'varchar',
    length: 150,
  })
  //#endregion
  serviceId: string;
}

@Taon.Controller({
  className: 'PortsController',
})
class PortsController extends Taon.Base.CrudController<Port> {
  entityClassResolveFn = () => Port;

  @Taon.Http.GET({
    path: '/info',
    pathIsGlobal: true,
  })
  info(): Taon.Response<string> {
    //#region @websqlFunc
    return async (req, res) => {
      return 'Hello from ports controller';
    };
    //#endregion
  }

  async initExampleDbData() {
    //#region @websql
    await this.db.save(
      Port.from({
        port: 4200,
        type: 'in-use-by-os-or-other-apps',
        serviceId: 'angular dev server',
      }),
    );
    await this.db.save(
      Port.from({
        port: 3000,
        type: 'in-use-by-os-or-other-apps',
        serviceId: 'standard nodejs server',
      }),
    );
    // await this.db.save(
    //   Port.from({
    //     port: 4200,
    //     serviceId: 'angular dev server',
    //   }),
    // );
    //#endregion
  }
}

var PortsContext = Taon.createContext(() => ({
  contextName: 'PortsContext',
  contexts: { BaseContext },
  controllers: { PortsController },
  entities: { Port },
  database: true,
  logs: true,
}));

const START_PORT = 3600;

class $Service extends CommandLineFeature<{}, Project> {
  protected async __initialize__() {
    // console.log(this.params)
  }

  public async _() {
    console.log('helllo from taon service');
  }

  /**
   * start in sync mode
   * this will crash if process already started
   */
  async startCommand() {
    const port = await this.project.assignFreePort(START_PORT);
    // const ref =
    await PortsContext.initialize({
      overrideHost: `http://localhost:${port}`,
    });
    Helpers.info(`Service started on port http://localhost:${port}/info`);

    const ref = await PortsContext.initialize({
      overrideRemoteHost: `http://localhost:${START_PORT}`,
    });
    this._bashOrShellInfo();
    // const portControllerInstance = ref.getInstanceBy(PortsController);
    // const info = await portControllerInstance.info().received;
    // console.log(`Info from service: "${info.body.text}"`);
    this._infoScreen();
  }

  /**
   * connect to service from other process
   */
  async connect() {
    const ref = await PortsContext.initialize({
      overrideRemoteHost: `http://localhost:${START_PORT}`,
    });
    const portControllerInstance = ref.getInstanceBy(PortsController);
    const info = await portControllerInstance.info().received;
    console.log(`Info from service: "${info.body.text}"`);
    this._exit(0);
  }

  /**
   * start if not started detached process
   */
  start() {
    Helpers.run(
      `${config.frameworkName} ${CLASS.getName($Service)}:${'startCommand' as keyof $Service}`,
      {
        biggerBuffer: true,
      },
    ).async(true);
    this._bashOrShellInfo();
    Helpers.info(`Detached service started...`);
    this._exit(0);
  }

  async _infoScreen() {
    while (true) {
      Helpers.clearConsole();
      Helpers.info(
        `Service started on port http://localhost${chalk.bold(START_PORT.toString())}`,
      );
      const choices = {
        openBrowser: {
          name: 'Open browser with service app',
        },
        showAllProcesses: {
          name: 'Show all processes',
        },
        showLogo: {
          name: 'Show logo',
        },
        exit: {
          name: `Shut down ${chalk.bold(_.upperFirst(config.frameworkName) + ' service')}`,
        },
      };
      const choice = await UtilsTerminal.select<keyof typeof choices>({
        choices,
        question: 'Choose action',
      });
      if (choice === 'exit') {
        this._exit(0);
      }
      switch (choice) {
        case 'exit':
          this._exit(0);

        case 'showLogo':
          Helpers.clearConsole();
          console.log(this.logo);
          Helpers.pressKeyAndContinue();
          continue;
      }
    }
  }

  get logo() {
    return `               YY
      YXY    ZXXXX    ZYXY
     ZXXXXYZYXXXXXXXYXXXXY
     XXXXXWTTTVXWUTTUXXXXX
    ZXXXXVTTTTRRRSTTTUWXXXY
    YXXXUTTTSRRRRRRTTTTVXXX
    XXXUTTTTTRRRRRRTTTTTVXXX
   ZXXXXVTTTTRRRRRTTTTTWXXXX
   YXXXXXWUTTTRRRRTTTUXXXXXX
      YXXXXUTTRRRSTTVXXXXY
        ZXXXVTTRRTTWXXY
           ZXWTRSUXY
              YTVZ    `;
  }

  private _bashOrShellInfo() {
    const currentBash = UtilsProcess.getBashOrShellName();
    Helpers.logInfo(` current bash/shell: ${currentBash}`);
  }

  /**
   * stop if started
   */
  kill() {
    Helpers.killOnPort(START_PORT);
    this._exit();
  }

  /**
   * kill detached process and start again
   */
  restart() {}
}

export default {
  $Service: Helpers.CLIWRAP($Service, '$Service'),
};
