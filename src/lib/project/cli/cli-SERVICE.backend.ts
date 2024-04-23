//#region @backend
import { _, chalk } from "tnp-core/src";
import { Helpers } from "tnp-helpers/src";
import { CommandLineFeature } from "tnp-helpers/src";
import { Project } from "../abstract/project";
import { BuildOptions } from "../../build-options";

class $Service extends CommandLineFeature<{}, Project> {
  protected async __initialize__() {

    // console.log(this.params)
  }

  public async _() {
    console.log('helllo from firedev service');
  }

}


export default {
  $Service: Helpers.CLIWRAP($Service, '$Service'),
}
//#endregion
