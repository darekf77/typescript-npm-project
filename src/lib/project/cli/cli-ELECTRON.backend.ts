//#region @backend
import { _ } from "tnp-core/src";
import { Helpers } from "tnp-helpers/src";
import { CommandLineFeature } from "tnp-helpers/src";
import { Project } from "../abstract/project";
import { BuildOptions, ReleaseOptions } from "../../build-options";
import { TEMP_DOCS } from "../../constants";
import { config } from "tnp-config";


class $Electron extends CommandLineFeature<BuildOptions, Project> {
  protected async __initialize__() {
    this.params = BuildOptions.from(this.params);
    await this.project.recreateReleaseProject();
  }

  public async _() {
    await this.project.build(BuildOptions.from({
      ...this.params,
      buildType: 'app',
      targetApp: 'electron',
      buildForRelease: true,
      finishCallback: () => this._exit(),
    }));
  }


  async watch() {
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
