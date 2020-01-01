//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';

import { PackagesRecognitionExtended } from '../../features/packages-recognition-extended';
import { FILE_NAME_ISOMORPHIC_PACKAGES } from 'morphi';
import { config as configMorphi } from 'morphi';
import { TnpDB } from '../../../tnp-db';
//#endregion

import { Project } from './project';
import { Helpers } from '../../../helpers';
import { Morphi } from 'morphi';
import { Models } from '../../../models';
import { config } from '../../../config';

export abstract class TnpProject {

  public type: Models.libs.LibType;

  get linkedProjects(this: Project): Project[] {
    //#region @backendFunc
    const db = TnpDB.InstanceSync;
    const projects = this.packageJson.linkedProjects.map(pathOrName => {
      let proj: Project;
      if (path.isAbsolute(pathOrName)) {
        proj = Project.From(pathOrName);
      }
      if (!proj) {
        proj = Project.From(path.join(this.location, pathOrName))
      }
      if (!proj) {
        const fromALl = db.getProjects().find(({ project }) => {
          const { name, genericName } = project;
          return (name === pathOrName || genericName === pathOrName)
        })
        if (fromALl) {
          proj = fromALl.project;
        }
      }
      if (!proj) {
        Helpers.warn(`[linkedProjects] Not able to find project by value: ${pathOrName}`);
      }
      return proj;
    }).filter(f => !!f);
    return projects;
    //#endregion
  }



  public applyLinkedPorjects(this: Project) {
    //#region @backendFunc
    this.linkedProjects.forEach(p => {
      const sourceFolder = p.type === 'angular-lib' ? config.folder.components : config.folder.src;
      Helpers.createSymLink(path.join(p.location, sourceFolder), path.join(this.location, sourceFolder, `tmp-${p.name}`));
    });
    //#endregion
  }

  public get frameworkVersion(this: Project) {
    //#region @backendFunc
    return this.packageJson.frameworkVersion
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
    const isomorphicPackagesArr = this.linkedProjects.map(p => p.name)

    if (this.type === 'unknow') {
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
