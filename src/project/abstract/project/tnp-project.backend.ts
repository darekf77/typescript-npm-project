import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';

import { Project } from './project';
import { Helpers } from '../../../helpers';
import { Morphi } from 'morphi';
import { Models } from '../../../models';
import { config } from '../../../config';
import { PackagesRecognitionExtended } from '../../features/packages-recognition-extended';
import { FILE_NAME_ISOMORPHIC_PACKAGES } from 'morphi/build/packages-recognition';
import { config as configMorphi } from 'morphi/build/config';

export abstract class TnpProject {

  public type: Models.libs.LibType;

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
    if (Morphi.IsBrowser) {
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
    if (Morphi.IsBrowser) {
      return this.browser.useFramework;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return false;
    }
    if (!!this.baseline) {
      return this.baseline.packageJson.useFramework;
    }
    return this.packageJson.useFramework;
    //#endregion
  }

  get isBundleMode(this: Project) {
    if (Morphi.IsBrowser) {
      return true;
    }
    //#region @backend
    return Project.isBundleMode;
    //#endregion
  }

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
}

// export interface TnpProject extends Partial<Project> { }
