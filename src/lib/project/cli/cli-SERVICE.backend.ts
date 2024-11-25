//#region imports
import { _, child_process, crossPlatformPath, os } from 'tnp-core/src';
import { Helpers, UtilsTerminal } from 'tnp-helpers/src';
import { CommandLineFeature } from 'tnp-helpers/src';
import { Project } from '../abstract/project';
import { BuildOptions } from '../../build-options';
import { config } from 'tnp-config/src';
import { Taon, BaseContext } from 'taon/src';
import { fse, chalk } from 'tnp-core/src';
import { UtilsProcess } from 'tnp-core/src';
import { CLASS } from 'typescript-class-helpers/src';
//#endregion

//#region constants
const START_PORT = 3600;
//#endregion

//#region models
export interface ServiceOptions {
  name: string;
  pid: string;
  port: number;
}
//#endregion

class $Service extends CommandLineFeature<{}, Project> {
  //#region methods / initialize
  protected async __initialize__() {
    // console.log(this.params)
  }
  //#endregion

  //#region methods / _
  public async _() {
    console.log('helllo from taon service');
  }
  //#endregion
}

export default {
  $Service: Helpers.CLIWRAP($Service, '$Service'),
};
