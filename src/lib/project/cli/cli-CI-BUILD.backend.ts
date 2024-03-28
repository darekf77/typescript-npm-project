//#region @backend
import { _ } from "tnp-core/src";
import { Helpers } from "tnp-helpers/src";
import { CommandLineFeature } from "tnp-helpers/src";
import { Project } from "../abstract/project";
import { BuildOptions } from "../../build-options";
import { TEMP_DOCS } from "../../constants";


class $CiBuild extends CommandLineFeature<BuildOptions, Project> {
  protected async __initialize__() {
    this.params = BuildOptions.from(this.params);
  }

  public async _() {

  }


}


export default {
  $CiBuild: Helpers.CLIWRAP($CiBuild, '$CiBuild'),
}
//#endregion
