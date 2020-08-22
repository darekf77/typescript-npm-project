//#region @backend
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
//#endregion

import type { Project } from './project';
import { Models } from 'tnp-models';
import { Helpers, Project as $Project } from 'tnp-helpers';
import { config } from '../../../config';

export class NpmProject {
  /**
   * Version from package.json
   */
  get version(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.version;
    }
    //#region @backend
    return this.packageJson && this.packageJson.version;
    //#endregion
  }

  get lastNpmVersion(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.lastNpmVersion;
    }
    //#region @backend
    let lastNpmVersion = void 0 as string;
    try {
      const ver = this.run(`npm show ${this.name} version`, { output: false }).sync().toString();
      if (ver) {
        lastNpmVersion = ver.trim();
      }
    } catch (error) { }
    return lastNpmVersion;
    //#endregion
  }

  get resources(this: Project): string[] {
    if (Helpers.isBrowser) {
      return this.browser.resources;
    }
    //#region @backend
    if (this.typeIs('unknow')) {
      return []
    }
    return this.packageJson.resources;
    //#endregion
  }

  get isUnknowNpmProject(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isUnknowNpmProject;
    }
    //#region @backend
    return this.typeIs('unknow-npm-project');
    //#endregion
  }

  get preview(this: Project): Project {
    if (Helpers.isBrowser) {
      return this.browser.preview as any;
    }
    //#region @backend
    return _.isString(this.location) && $Project.From<Project>(path.join(this.location, 'preview'));
    //#endregion
  }

  //#region @backend
  get versionPatchedPlusOne(this: Project) {
    if (this.typeIs('unknow')) {
      return '';
    }
    if (!this.version) {

      if (!global[config.message.globalSystemToolMode]) {
        return;
      }

      Helpers.error(`Please define ${chalk.bold('version')} property in your package.json:
      location: ${path.join(this.location, config.file.package_json)}

      `, true, true);
    }
    const ver = this.version.split('.');
    if (ver.length > 0) {
      ver[ver.length - 1] = (parseInt(ver[ver.length - 1]) + 1).toString()
    }
    return ver.join('.')
  }
  //#endregion

  public get name(this: Project): string {
    if (Helpers.isBrowser) {
      return this.browser.name;
    }
    //#region @backendFunc
    if (this.packageJson && this.typeIs('unknow-npm-project')) {
      if (this.packageJson.name !== path.basename(this.location)
        && path.basename(path.dirname(this.location)) === 'external') {
        return path.basename(this.location);
      }
    }
    return this.packageJson ? this.packageJson.name : path.basename(this.location);
    //#endregion
  }

  //#region @backend
  get hasNpmOrganization(this: Project) {
    // log('path.dirname(this.location)', path.dirname(this.location))
    if (this.typeIs('unknow')) {
      return false;
    }
    return path.basename(path.dirname(this.location)).startsWith('@');
  }

  get npmOrganization(this: Project) {
    if (!this.hasNpmOrganization) {
      return;
    }
    return path.basename(path.dirname(this.location))
  }
  //#endregion

  //#region @backend
  public allPackageJsonDeps(this: Project, contextFolder?: string): Project[] {
    if (this.typeIs('unknow')) {
      return [];
    }
    let projectsInNodeModules = [];
    Models.npm.ArrNpmDependencyType.forEach(depName => {
      projectsInNodeModules = projectsInNodeModules
        .concat(this.getDepsAsProject(depName, contextFolder));
    });
    return projectsInNodeModules;
  }
  //#endregion

  //#region @backend
  public getDepsAsProject(this: Project, type: Models.npm.NpmDependencyType | Models.npm.TnpNpmDependencyType,
    contextFolder?: string): Project[] {
    if (this.typeIs('unknow')) {
      return [];
    }
    return this.getDepsAsPackage(type).map(packageObj => {
      if (type === 'tnp_required_workspace_child') {
        let p = path.resolve(path.join(this.location, '..', packageObj.name))
        if (this.isWorkspaceChildProject && fse.existsSync(p)) {
          const project = $Project.From<Project>(p);
          return project;
        }
      }

      let p = path.join(contextFolder ? contextFolder : this.location, config.folder.node_modules, packageObj.name);
      if (fse.existsSync(p)) {
        const project = $Project.From<Project>(p);
        return project;
      }
      // warn(`Dependency '${packageObj.name}' doen't exist in ${p}`)
    })
      .filter(f => !!f)
  }
  //#endregion

  //#region @backend
  public getDepsAsPackage(this: Project, type: Models.npm.NpmDependencyType | Models.npm.TnpNpmDependencyType): Models.npm.Package[] {
    if (this.typeIs('unknow')) {
      return [];
    }
    if (!this.packageJson.data) {
      return [];
    }
    const isTnpOverridedDependency = (type === 'tnp_overrided_dependencies') &&
      this.packageJson.data.tnp &&
      this.packageJson.data.tnp.overrided &&
      this.packageJson.data.tnp.overrided.dependencies;

    const isTnpRequredWorkspaceChildren = (type === 'tnp_required_workspace_child') &&
      this.packageJson.data.tnp &&
      this.packageJson.data.tnp.required;

    let installType: Models.npm.InstalationType;

    let data: any;
    if (isTnpOverridedDependency) {
      data = this.packageJson.data.tnp.overrided.dependencies
    } else if (isTnpRequredWorkspaceChildren) {
      data = this.packageJson.data.tnp.required;
    } else {
      data = this.packageJson.data[type];
      if (type === 'dependencies') {
        installType = '--save'
      } else if (type === 'devDependencies') {
        installType = '--save-dev'
      }
    }

    const names = _.isArray(data) ? data : _.keys(data);
    return names
      .map(p => {
        if (_.isString(data[p])) {
          return { name: p, version: data[p], installType }
        } else {
          if (!~p.search('@')) {
            return { name: p, installType }
          }
          const isOrg = p.startsWith('@')
          const [name, version] = (isOrg ? p.slice(1) : p).split('@')
          return { name: isOrg ? `@${name}` : name, version, installType }
        }

      })
  }
  //#endregion

  //#region @backend
  public checkIfReadyForNpm(this: Project) {
    if (this.typeIs('unknow')) {
      return false;
    }
    // log('TYPEEEEE', this.type)
    const libs: Models.libs.LibType[] = ['angular-lib', 'isomorphic-lib'];
    if (this.typeIsNot(...libs)) {
      Helpers.error(`This project '${chalk.bold(this.name)}' isn't library type project (${libs.join(', ')}).`)
    }
    return true;
  }
  //#endregion

  get childrenThatAreThirdPartyInNodeModules(this: Project): Project[] {
    if (Helpers.isBrowser) {
      return this.browser.childrenThatAreThirdPartyInNodeModules as any;
    }
    //#region @backend
    if (this.typeIs('unknow')) {
      return;
    }
    return this.isomorphicPackages.map(c => {
      const p = path.join(this.location, config.folder.node_modules, c);
      return $Project.From<Project>(p);
    }).filter(f => !!f);
    //#endregion
  }

}
