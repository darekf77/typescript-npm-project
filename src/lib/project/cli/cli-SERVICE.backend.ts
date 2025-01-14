//#region imports
import {
  _,
  child_process,
  crossPlatformPath,
  UtilsTerminal,
  os,
} from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { BaseCommandLineFeature } from 'tnp-helpers/src';
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

class $Service extends BaseCommandLineFeature<{}, Project> {
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
