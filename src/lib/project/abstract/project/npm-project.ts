//#region @backend
import { _, CoreConfig } from 'tnp-core';
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import chalk from 'chalk';
import * as semver from 'semver';
//#endregion

import type { Project } from './project';
import { Models } from 'tnp-models';
import { Helpers, Project as $Project } from 'tnp-helpers';
import { config, ConfigModels } from 'tnp-config';

export class NpmProject {

  // @ts-ignore
  get canBePublishToNpmRegistry(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.canBePublishToNpmRegistry;
    }
    //#region @backend
    return this.packageJson && this.packageJson.canBePublishToNpmRegistry;
    //#endregion
  }

  /**
   * Version from package.json
   */
  // @ts-ignore
  get version(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.version;
    }
    //#region @backend
    return this.packageJson && this.packageJson.version;
    //#endregion
  }

  /**
   * Version from package.json
   */
  // @ts-ignore
  get majorVersion(this: Project): number {
    if (Helpers.isBrowser) {
      return this.browser.majorVersion;
    }
    //#region @backend
    return Number(_.first((this.packageJson?.version || '').split('.')));
    //#endregion
  }

  /**
   * {
   *  version: "<major>.<minor>.<path>"
   * }
   *
   * This function is setting minor version
   * example
   * {
   *  version:"3.1.4"
   * }
   * with @param minorVersionToSet equals 4
   * will result in
   * {
   *  version:"3.4.4"
   * }
   */
  async setMinorVersion(this: Project, minorVersionToSet: number) {
    if (this.typeIs('unknow')) {
      return '';
    }

    minorVersionToSet = Number(minorVersionToSet);
    if (isNaN(minorVersionToSet) || !Number.isInteger(minorVersionToSet)) {
      Helpers.error(`Wrong minor version to set: ${minorVersionToSet}`, false, true);
    }

    const ver = this.version.split('.');
    if (ver.length !== 3) {
      Helpers.error(`Wrong version in project: ${this.project}`, false, true);
    }

    const currentMinorVersion = Number(ver[1]);
    const newVer = [ver[0], minorVersionToSet, ver[2]].join('.');

    if (minorVersionToSet <= currentMinorVersion) {
      Helpers.warn(`Ommiting... Trying to set same or lower minor version for project: ${this.genericName}
        ${this.version} => v${newVer}
      `)
    } else {
      await this.setNewVersion(newVer);
    }
  }


  /**
   * {
   *  version: "<major>.<minor>.<path>"
   * }
   *
   * This function is setting minor version
   * example
   * {
   *  version:"3.1.4"
   * }
   * with @param minorVersionToSet equals 15
   * will result in
   * {
   *  version:"15.1.4"
   * }
   */
  async setMajorVersion(this: Project, majorVersionToSet: number) {
    if (this.typeIs('unknow')) {
      return '';
    }

    majorVersionToSet = Number(majorVersionToSet);
    if (isNaN(majorVersionToSet) || !Number.isInteger(majorVersionToSet)) {
      Helpers.error(`Wrong major version to set: ${majorVersionToSet}`, false, true);
    }

    const ver = this.version.split('.');
    if (ver.length !== 3) {
      Helpers.error(`Wrong version in project: ${this.project}`, false, true);
    }

    const currentMajorVersion = Number(ver[0]);
    const newMajorVer = [majorVersionToSet, ver[1], ver[2]].join('.');

    if (majorVersionToSet <= currentMajorVersion) {
      Helpers.warn(`Ommiting... Trying to set same or lower minor version for project: ${this.genericName}
        ${this.version} => v${newMajorVer}
      `)
    } else {
      await this.setNewVersion(newMajorVer);
    }
  }

  async setFramworkVersion(this: Project, frameworkVersionArg: ConfigModels.FrameworkVersion) {
    if (this.typeIs('unknow')) {
      return '';
    }

    // @ts-ignore
    this.packageJson.data.tnp.version = frameworkVersionArg;
    this.packageJson.save('updating framework version')
  }

  async setNewVersion(this: Project, version: string) {
    Helpers.info(`Setting version to project  ${this.genericName}: v${version}`);
    this.packageJson.data.version = version;
    this.packageJson.save('updating version')
  }


  // @ts-ignore
  get isPrivate(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isPrivate;
    }
    //#region @backend
    return !!this.packageJson.isPrivate;
    //#endregion
  }

  // @ts-ignore
  get shouldBeOmmitedInRelease(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.omitInRelease;
    }
    //#region @backend
    return !!this.packageJson['omitInRelease'];
    //#endregion
  }

  // @ts-ignore
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

  // @ts-ignore
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

  // @ts-ignore
  get isUnknowNpmProject(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isUnknowNpmProject;
    }
    //#region @backend
    return this.typeIs('unknow-npm-project');
    //#endregion
  }

  // @ts-ignore
  get preview(this: Project): Project {
    if (Helpers.isBrowser) {
      return this.browser.preview as any;
    }
    //#region @backend
    return _.isString(this.location) && $Project.From<Project>(path.join(this.location, 'preview'));
    //#endregion
  }

  //#region @backend
  // @ts-ignore
  get versionPatchedPlusOne(this: Project) {
    if (this.typeIs('unknow')) {
      return '';
    }
    if (!this.version) {

      if (!global[CoreConfig.message.globalSystemToolMode]) {
        return;
      }

      Helpers.error(`Please define ${chalk.bold('version')} property in your package.json:
      location: ${path.join(this.location, config.file.package_json)}

      `, true, true);
    }
    const ver = this.version.split('.');
    if (ver.length > 0) {
      ver[ver.length - 1] = (parseInt(_.last(ver)) + 1).toString();
    }
    return ver.join('.')
  }

  // @ts-ignore
  get versionMajorPlusWithZeros(this: Project) {
    if (this.typeIs('unknow')) {
      return '';
    }
    if (!this.version) {

      if (!global[CoreConfig.message.globalSystemToolMode]) {
        return;
      }

      Helpers.error(`Please define ${chalk.bold('version')} property in your package.json:
      location: ${path.join(this.location, config.file.package_json)}

      `, true, true);
    }
    const ver = this.version.split('.');
    if (ver.length > 0) {
      ver[0] = (parseInt(_.first(ver)) + 1).toString();
      for (let index = 1; index < ver.length; index++) {
        ver[index] = '0';
      }
    } else {
      Helpers.warn(`[npm-project] something went wrong with bumping major version`)
    }
    return ver.join('.');
  }

  // @ts-ignore
  get versionMinorPlusWithZeros(this: Project) {
    if (this.typeIs('unknow')) {
      return '';
    }
    if (!this.version) {

      if (!global[CoreConfig.message.globalSystemToolMode]) {
        return;
      }

      Helpers.error(`Please define ${chalk.bold('version')} property in your package.json:
      location: ${path.join(this.location, config.file.package_json)}

      `, true, true);
    }
    const ver = this.version.split('.');
    if (ver.length > 1) {
      ver[1] = (parseInt(ver[1]) + 1).toString();
      for (let index = 2; index < ver.length; index++) {
        ver[index] = '0';
      }
    } else {
      Helpers.warn(`[npm-project] something went wrong with bumping minor version`)
    }
    return ver.join('.');
  }

  private updateVersionPathRelease(this: Project, versionPath: number) {
    const ver = this.version.split('.');
    if (ver.length > 0) {
      ver[ver.length - 1] = versionPath.toString();
    }
    const versionToUpdate = ver.join('.');
    this.packageJson.data.version = versionToUpdate.toString();
    this.packageJson.save(`[npm-project] updating version path`);
  }

  bumpVersionForPathRelease(proj: Project) {
    let atLestVersion = proj.git.lastTagVersionName.trim().replace('v', '') || '0.0.0';
    if (semver.gt(proj.version, atLestVersion)) {
      atLestVersion = proj.version;
    }

    proj.packageJson.data.version = atLestVersion;
    proj.packageJson.data.version = proj.versionPatchedPlusOne;
    proj.packageJson.save('bump for patch release');
  }

  get versionPathAsNumber() {
    const ver = this.version.split('.');
    const res = Number(_.last(ver));
    return isNaN(res) ? 0 : res;
  }

  //@ts-ignore
  get createNewVersionWithTagFor(this: Project) {
    const that = this;
    return {
      pathRelease(commitMsg?: string) {
        const proj = that as Project;
        let currentPathNum = proj.versionPathAsNumber; // + 1;
        let commitMessage = commitMsg ? commitMsg.trim() : ('new version ' + proj.version);
        proj.git.commit(commitMessage);
        let tagName = `v${proj.version}`;

        while (true) {
          if (proj.git.checkTagExists(tagName)) {
            Helpers.warn(`[${config.frameworkName}] tag taken: ${tagName}.. looking for new...`);
            proj.updateVersionPathRelease(++currentPathNum);
            tagName = `v${proj.versionPatchedPlusOne}`;
            commitMessage = commitMsg ? commitMsg.trim() : ('new version ' + proj.versionPatchedPlusOne);
            proj.git.commit(commitMessage);
          } else {
            break;
          }
        }

        proj.run(`git tag -a ${tagName} `
          + `-m "${commitMessage}"`,
          { output: false }).sync();
        return { newVersion: proj.versionPatchedPlusOne };
      }
    };
  }

  //#endregion

  // @ts-ignore
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

  // @ts-ignore
  get hasNpmOrganization(this: Project) {
    // log('path.dirname(this.location)', path.dirname(this.location))
    if (this.typeIs('unknow')) {
      return false;
    }
    return path.basename(path.dirname(this.location)).startsWith('@');
  }

  // @ts-ignore
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
  public checkIfReadyForNpm(this: Project, soft = false) {
    if (this.typeIs('unknow')) {
      return false;
    }

    if (this.isSmartContainer) {
      return true;
    }

    // log('TYPEEEEE', this.type)
    const libs: ConfigModels.LibType[] = ['angular-lib', 'isomorphic-lib', 'vscode-ext'];
    if (this.typeIsNot(...libs)) {
      if (soft) {
        return false;
      }
      Helpers.error(`This project '${chalk.bold(this.name)}' in ${this.location}

      isn't library type project (${libs.join(', ')}).`, false, true);
    }
    return true;
  }
  //#endregion

  // @ts-ignore
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
