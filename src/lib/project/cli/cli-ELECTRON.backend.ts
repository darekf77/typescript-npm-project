//#region @backend
import { _ } from "tnp-core/src";
import { Helpers } from "tnp-helpers/src";
import { CommandLineFeature } from "tnp-helpers/src";
import { Project } from "../abstract/project";
import { BuildOptions, ReleaseOptions } from "../../build-options";
import { TEMP_DOCS } from "../../constants";
import { config } from "tnp-config";
import { crossPlatformPath } from "tnp-core";


class $Electron extends CommandLineFeature<BuildOptions, Project> {
  protected async __initialize__() {
    this.params = BuildOptions.from(this.params);

  }

  async _prepare() {
    this.project.tryKillAllElectronInstances()
    // await this.project.recreateReleaseProject(true);
  }

  public async _() {
    await this._prepare();
    await this.project.build(BuildOptions.from({
      ...this.params,
      buildType: 'app',
      targetApp: 'electron',
      buildForRelease: true,
      finishCallback: () => this._exit(),
    }));
    this._exit()
  }

  async ncc() {
    // Helpers.ncc()
    // console.log(data.assets)
    this._exit()
  }

  kill() {
    this.project.tryKillAllElectronInstances();
    this._exit()
  }

  async watch() {
    await this._prepare();
    await this.project.build(BuildOptions.from({
      ...this.params,
      buildType: 'app',
      targetApp: 'electron',
      watch: true,
    }));
  }

}


export default {
  $Electron: Helpers.CLIWRAP($Electron, '$Electron'),
}
//#endregion
