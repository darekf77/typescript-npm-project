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
import { Helpers } from 'tnp-helpers';
import { Morphi } from 'morphi';
import { Models } from 'tnp-models';
import { config } from '../../../config';



export abstract class TnpProject {

  /**
   * Do use this variable for comparatios
   * ONLY FOR VIEWING
   */
  public readonly _type: Models.libs.LibType;

  public setType(this: Project, type: Models.libs.LibType) {
    // @ts-ignore
    this._type = type;
  }
  public typeIs(this: Project, ...types: Models.libs.LibType[]) {
    return this._type && types.includes(this._type);
  }

  public typeIsNot(this: Project, ...types: Models.libs.LibType[]) {
    return !this.typeIs(...types);
  }

  public get _frameworkVersion(this: Project) {
    //#region @backendFunc
    return this.packageJson.frameworkVersion
    //#endregion
  }

  public get frameworkVersionMinusOne(this: Project): Models.libs.FrameworkVersion {
    //#region @backendFunc
    const curr = Number(_.isString(this._frameworkVersion) && this._frameworkVersion.replace('v', ''))
    if (!isNaN(curr) && curr >= 2) {
      return `v${curr - 1}` as Models.libs.FrameworkVersion;
    };
    return 'v1';
    //#endregion
  }

  //#region @backend
  public frameworkVersionEquals(this: Project, version: Models.libs.FrameworkVersion) {
    const ver = Number(_.isString(version) && version.replace('v', ''));
    const curr = Number(_.isString(this._frameworkVersion) && this._frameworkVersion.replace('v', ''))
    return !isNaN(ver) && !isNaN(curr) && (curr === ver);
  }
  public frameworkVersionAtLeast(this: Project, version: Models.libs.FrameworkVersion) {
    const ver = Number(_.isString(version) && version.replace('v', ''));
    const curr = Number(_.isString(this._frameworkVersion) && this._frameworkVersion.replace('v', ''))
    return !isNaN(ver) && !isNaN(curr) && (curr >= ver);
  }
  //#endregion

  //#region @backend
  /**
   * available frameworks in project
   */
  get frameworks(this: Project) {
    if (this.typeIs('unknow')) {
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
    if (this.typeIs('unknow')) {
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
    if (this.typeIs('unknow')) {
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
    const isomorphicPackagesArr = this.linkedProjects.map(p => p.name)

    if (this.typeIs('unknow')) {
      return isomorphicPackagesArr;
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
        return isomorphicPackagesArr.concat(arr);
      } else {
        return isomorphicPackagesArr;
      }
      // warn(`Isomorphic package file does not exists : ${p}`);
    } catch (e) {
      if (global.tnp_normal_mode) {
        Helpers.log(e);
        Helpers.error(`Erro while reading ismorphic package file: ${p}`, true, true);
      }
      return isomorphicPackagesArr;
    };
  }
  //#endregion
}
