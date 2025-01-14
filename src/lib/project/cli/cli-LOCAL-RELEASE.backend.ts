import { CoreModels, _, chalk, path } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { BaseCommandLineFeature } from 'tnp-helpers/src';
import { Project } from '../abstract/project';
import { BuildOptions, ReleaseOptions } from '../../build-options';

class $LocalRelease extends BaseCommandLineFeature<ReleaseOptions, Project> {
  //#region _
  public async _() {
    Helpers.clearConsole();
    const menuOption = await this._menu();
    if (menuOption === 'cli') {
      await this.cli();
    }
    this._exit();
  }
  //#endregion

  async cli() {
    await this.project.localRelease.startCLiRelease();
    Helpers.info(`Local release for CLI is done`);
    this._exit();
  }

  //#region local release menu
  public async _menu() {
    const currentVersion = this.project.npmHelpers.version;
    const options = {
      //#region cli
      cli: {
        name:
          `${chalk.bold.gray('CLI')}` +
          chalk.italic(
            ` (local_release/cli/` +
              `${
                this.project.name.endsWith('-cli')
                  ? this.project.name
                  : this.project.name + '-cli'
              }-v${currentVersion})`,
          ),
      },
      //#endregion
      //#region electron
      electron: {
        name:
          `${chalk.bold.gray('Electron')} ` +
          `(local_release/electron-desktop-app/` +
          `${
            this.project.name.endsWith('-app')
              ? this.project.name
              : this.project.name + '-app'
          }-v${currentVersion})`,
      },
      //#endregion
      //#region vscodeExt
      vscodeExt: {
        name:
          `${chalk.bold.gray('VScode Extension')}` +
          ` (local_release/vscode-ext/${this.project.name}` +
          `-vscode-ext-v${currentVersion})`,
      },
      //#endregion
      //#region dockerizedBackendFront
      dockerizedBackendFrontend: {
        name:
          `${chalk.bold.gray('Dockerized backend/frontend')} ` +
          `(local_release/docker/${this.project.name}` +
          `-backend-frontend-v${currentVersion})`,
      },
      //#endregion
    };

    const res: keyof typeof options = await Helpers.consoleGui.select(
      'Select local releas type',
      Object.keys(options).map(k => {
        return {
          ...options[k],
          value: k,
        };
      }),
    );

    return res;
  }
  //#endregion
}

export default {
  $LocalRelease: Helpers.CLIWRAP($LocalRelease, '$LocalRelease'),
};
