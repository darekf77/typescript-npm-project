//#region @backend
import { fse, crossPlatformPath } from 'tnp-core'
import { path } from 'tnp-core'
import { _ } from 'tnp-core';
import { PackagesRecognition } from '../../features/package-recognition/packages-recognition';
//#endregion
import type { Project } from './project';
import { Project as $Project } from 'tnp-helpers';
import { Helpers } from 'tnp-helpers';
import { config, ConfigModels } from 'tnp-config';

export abstract class TnpProject {

  // @ts-ignore
  public get _frameworkVersion(this: Project) {
    //#region @backendFunc
    return this.packageJson.frameworkVersion;
    //#endregion
  }

  // @ts-ignore
  public get generateChangelog(this: Project) {
    //#region @backendFunc
    return this.packageJson.generateChangelog;
    //#endregion
  }




  // @ts-ignore
  public get frameworkVersionMinusOne(this: Project): ConfigModels.FrameworkVersion {
    //#region @backendFunc
    const curr = Number(_.isString(this._frameworkVersion) && this._frameworkVersion.replace('v', ''))
    if (!isNaN(curr) && curr >= 2) {
      return `v${curr - 1}` as ConfigModels.FrameworkVersion;
    };
    return 'v1';
    //#endregion
  }

  //#region @backend
  public frameworkVersionEquals(this: Project, version: ConfigModels.FrameworkVersion) {
    const ver = Number(_.isString(version) && version.replace('v', ''));
    const curr = Number(_.isString(this._frameworkVersion) && this._frameworkVersion.replace('v', ''))
    return !isNaN(ver) && !isNaN(curr) && (curr === ver);
  }
  public frameworkVersionAtLeast(this: Project, version: ConfigModels.FrameworkVersion) {
    const ver = Number(_.isString(version) && version.replace('v', ''));
    const curr = Number(_.isString(this._frameworkVersion) && this._frameworkVersion.replace('v', ''))
    return !isNaN(ver) && !isNaN(curr) && (curr >= ver);
  }

  public frameworkVersionLessThan(this: Project, version: ConfigModels.FrameworkVersion) {
    const ver = Number(_.isString(version) && version.replace('v', ''));
    const curr = Number(_.isString(this._frameworkVersion) && this._frameworkVersion.replace('v', ''))
    return !isNaN(ver) && !isNaN(curr) && (curr < ver);
  }
  //#endregion

  //#region @backend
  /**
   * available frameworks in project
   */
  // @ts-ignore
  get frameworks(this: Project) {
    if (this.typeIs('unknow')) {
      return [];
    }
    return this.packageJson.frameworks;
  }
  //#endregion

  // @ts-ignore
  get isTnp(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isTnp;
    }
    //#region @backend
    if (this.typeIsNot('isomorphic-lib')) {
      return false;
    }
    return this.location === $Project.Tnp.location;
    //#endregion
  }

  // @ts-ignore
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

  //#region @backend

  /**
   * array of isomorphic pacakges
   * example:
   * ['firedev', '@something/child', 'morphi' ]
   */ // @ts-ignore
  get isomorphicPackages(this: Project): string[] {
    const isomorphicPackagesArr = [];

    if (this.typeIs('unknow')) {
      return isomorphicPackagesArr;
    }
    try {
      let location = this.location;
      if (this.isContainerCoreProject) {
        location = path.dirname(this.smartNodeModules.path);
      }
      if (this.isContainerCoreProjectTempProj) {
        const origin = $Project.From(path.dirname(path.dirname(path.dirname(this.location)))) as Project;
        location = path.dirname(origin.smartNodeModules.path);
      }

      var p = crossPlatformPath(path.join(location, config.tempFiles.FILE_NAME_ISOMORPHIC_PACKAGES))
      if (!fse.existsSync(p)) {
        PackagesRecognition.fromProject(this as any).start(void 0, '[firedev-projct][getter isomorphic pacakges ]');
      }
      const f = Helpers.readJson(p);
      const arr = f[config.array.isomorphicPackages];
      if (_.isArray(arr)) {
        return isomorphicPackagesArr.concat(arr);
      } else {
        return isomorphicPackagesArr;
      }
      // warn(`Isomorphic package file does not exists : ${p}`);
    } catch (e) {
      if (global.globalSystemToolMode) {
        Helpers.log(e);
        Helpers.error(`Erro while reading ismorphic package file: ${p}`, true, true);
      }
      return isomorphicPackagesArr;
    };
  }
  //#endregion
}
