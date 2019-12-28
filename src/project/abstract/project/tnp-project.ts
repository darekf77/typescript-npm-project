//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';

import { PackagesRecognitionExtended } from '../../features/packages-recognition-extended';
import { FILE_NAME_ISOMORPHIC_PACKAGES } from 'morphi';
import { config as configMorphi } from 'morphi';
//#endregion

import { Project } from './project';
import { Helpers } from '../../../helpers';
import { Morphi } from 'morphi';
import { Models } from '../../../models';
import { config } from '../../../config';



export abstract class TnpProject {

  public type: Models.libs.LibType;
  public get frameworkVersion(this: Project) {
    //#region @backendFunc
    return this.packageJson.frameworkVersion;
    //#endregion
  }

  //#region @backend
  /**
   * available frameworks in project
   */
  get frameworks(this: Project) {
    if (this.type === 'unknow') {
      return [];
    }
    return this.packageJson.frameworks;
  }
  //#endregion

  get isTnp(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isTnp;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return false;
    }
    return this.name === 'tnp';
    //#endregion
  }

  get useFramework(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.useFramework;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return false;
    }
    if (!!this.baseline) {
      const baselineValue = this.baseline.packageJson.useFramework;
      if (!_.isUndefined(this.packageJson.useFramework)) {
        this.packageJson.data.tnp.useFramework = void 0;
        this.packageJson.writeToDisc();
      }
      return this.baseline.packageJson.useFramework;
    }
    return this.packageJson.useFramework;
    //#endregion
  }

  get isBundleMode(this: Project) {
    if (Helpers.isBrowser) {
      return true;
    }
    //#region @backend
    return Project.isBundleMode;
    //#endregion
  }

  //#region @backend
  get isomorphicPackages(this: Project) {
    if (this.type === 'unknow') {
      return [];
    }
    try {
      var p = path.join(this.location, FILE_NAME_ISOMORPHIC_PACKAGES)
      if (!fse.existsSync(p)) {
        PackagesRecognitionExtended.fromProject(this as any).start();
      }
      const f = fse.readJSONSync(p, {
        encoding: 'utf8'
      });
      const arr = f[configMorphi.array.isomorphicPackages];
      if (_.isArray(arr)) {
        return arr;
      } else {
        return [];
      }
      // warn(`Isomorphic package file does not exists : ${p}`);
    } catch (e) {
      if (global.tnp_normal_mode) {
        Helpers.log(e);
        Helpers.error(`Erro while reading ismorphic package file: ${p}`, true, true);
      }
      return [];
    };
  }
  //#endregion
}
