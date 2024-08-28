//#region imports
import { fse, CoreConfig, crossPlatformPath } from 'tnp-core/src';
import { path } from 'tnp-core/src';
import * as JSON5 from 'json5';
import * as json5Write from 'json10-writer/src';
import { _, CoreModels } from 'tnp-core/src';
import * as semver from 'semver';
import chalk from 'chalk';

import { config } from 'tnp-config/src';
import { Project } from '../../abstract/project';
import { Models } from '../../../models';
import { Helpers } from 'tnp-helpers/src';
//#endregion

export class PackageJsonCore {
  public data: Models.IPackageJSON;

  constructor(protected readonly cwd: string) {}

  get type(): CoreModels.LibType {
    const res = this.data.tnp ? this.data.tnp.type : undefined;
    if (_.isString(res)) {
      return res;
    }
    if (this.data && this.data.name) {
      return 'unknow-npm-project';
    }
  }

  get linkedRepos(): Models.LinkedRepo[] {
    const res = this.data.tnp ? this.data.tnp.linkedRepos : undefined;
    if (_.isArray(res)) {
      return res;
    }
    return [];
  }

  get linkedFolders() {
    const res = this.data?.tnp?.overrided?.linkedFolders;
    if (_.isArray(res)) {
      return res;
    }
    return [];
  }

  get canBePublishToNpmRegistry(): boolean {
    if (!this.data) {
      return false;
    }
    if (_.isBoolean(this.data.private)) {
      return !this.data.private;
    }
    return false;
  }

  get libReleaseOptions() {
    const res = this.data.tnp ? this.data.tnp.libReleaseOptions : undefined;
    if (_.isObject(res)) {
      return res;
    }
    return {};
  }

  get frameworkVersion(): CoreModels.FrameworkVersion {
    const res = this.data.tnp ? this.data.tnp.version : undefined;
    if (_.isString(res)) {
      return res;
    }
    return 'v1' as any;
  }

  get generateChangelog(): boolean {
    return !!(this.data.tnp as any)?.generateChangelog;
  }

  get smartContainerBuildTarget(): string {
    const res = this.data.tnp
      ? this.data.tnp.smartContainerBuildTarget
      : undefined;
    return res ? res : void 0;
  }

  get isSmart(): boolean {
    return !!this.data.tnp?.smart;
  }

  get isMonorepo(): boolean {
    return !!this.data.tnp?.monorepo;
  }

  get frameworks(): CoreModels.UIFramework[] {
    const res =
      this.data.tnp && _.isArray(this.data.tnp.frameworks)
        ? this.data.tnp.frameworks
        : config.frameworks;
    if (res.filter(f => !config.frameworks.includes(f)).length > 0) {
      Helpers.error(
        `[packagejson][frameworks] Unrecognized  frameworks` +
          ` in package.json ${JSON.stringify(this.data.tnp.frameworks)}`,
      );
    }
    return res;
  }

  get name() {
    if (!_.isString(this.data.name)) {
      if (global.globalSystemToolMode) {
        Helpers.error(
          `Please define name for npm project in location: ${this.pathPackageJson}`,
          false,
          true,
        );
      }
    }
    return this.data.name;
  }

  get version() {
    return this.data.version;
  }

  get isPrivate() {
    return this.data.private;
  }

  get resources(): string[] {
    const p = this.data.tnp;
    return Array.isArray(p.resources) ? p.resources : [];
  }

  dependencies(): string[] {
    const p = _.keys(this.data?.dependencies);
    // console.log(`${this.locationOfJson}`, p)
    return Array.isArray(p) ? p : [];
  }

  get dependsOn(): string[] {
    const p = this.data.tnp && this.data.tnp.dependsOn;
    // console.log(`${this.locationOfJson}`, p)
    return Array.isArray(p) ? p : [];
  }

  get targetProjects(): Omit<Models.TargetProject, 'path'>[] {
    const p = this.data.tnp && this.data.tnp.targetProjects;
    // console.log('asdasd',this.data.tnp.targetProjects)
    return Array.isArray(p) ? p : [];
  }

  setBuildHash(hash: string) {
    this.data.lastBuildTagHash = hash;
  }

  getBuildHash() {
    return this.data.lastBuildTagHash;
  }

  hasDependency(dependencyName: string, searchOnlyDependencies = false) {
    const deps = [
      ...Object.keys(this.data.dependencies || {}),
      ...(searchOnlyDependencies
        ? []
        : Object.keys(this.data.devDependencies || {})),
    ];
    return deps.includes(dependencyName);
  }

  get additionalNpmNames() {
    const p = this.data.tnp?.additionalNpmNames;
    return _.isArray(p) ? p : [];
  }

  get trusted(): Models.TrustedType {
    return this.data.tnp?.core?.dependencies?.trusted || ({} as any);
  }

  get trustedMaxMajor(): { [ver in CoreModels.FrameworkVersion]: number } {
    return (
      this.data.tnp?.core?.dependencies?.['trustedMaxMajor'] || ({} as any)
    );
  }

  get pathPackageJson() {
    return path.join(this.cwd, config.file.package_json);
  }

  get isLink() {
    return Helpers.isSymlinkFileExitedOrUnexisted(this.pathPackageJson);
  }

  get isCoreProject() {
    if (this.data.tnp && !_.isUndefined(this.data.tnp.isCoreProject)) {
      if (_.isBoolean(this.data.tnp.isCoreProject)) {
        return this.data.tnp.isCoreProject;
      }
      Helpers.error(
        `Bad value in package.json, tnp.isCoreProject should be boolean.`,
        true,
      );
      Helpers.error(`Location of package.json: ${this.cwd}`);
    }
    return false;
  }

  get isCommandLineToolOnly() {
    if (this.data.tnp && !_.isUndefined(this.data.tnp.isCommandLineToolOnly)) {
      if (_.isBoolean(this.data.tnp.isCommandLineToolOnly)) {
        return this.data.tnp.isCommandLineToolOnly;
      }
      Helpers.error(
        `Bad value in package.json, tnp.isCommandLineToolOnly should be boolean.`,
        true,
      );
      Helpers.error(`Location of package.json: ${this.cwd}`);
    }
    return false;
  }

  get useFramework() {
    if (this.data.tnp && !_.isUndefined(this.data.tnp.useFramework)) {
      if (_.isBoolean(this.data.tnp.useFramework)) {
        return this.data.tnp.useFramework;
      }
      Helpers.error(
        `Bad value in package.json, tnp.useFramework should be boolean.`,
        true,
      );
      Helpers.error(`Location of package.json: ${this.cwd}`);
    }
    return false;
  }

  public copyWithoutDependenciesTo(projectOrPath: Project | String) {
    this.copyTo(projectOrPath);
    const dest = path.join(
      _.isString(projectOrPath)
        ? projectOrPath
        : (projectOrPath as Project).location,
    );
    Project.ins.From(dest);
  }

  public copyTo(projectOrPath: Project | String) {
    if (!(_.isObject(projectOrPath) || _.isString(projectOrPath))) {
      Helpers.error(`[packagejson][copyTo] Incorrect project of path`);
    }
    const dest = path.join(
      _.isString(projectOrPath)
        ? projectOrPath
        : (projectOrPath as Project).location,
      config.file.package_json,
    );

    fse.copyFileSync(this.pathPackageJson, dest);
  }

  public setNamFromContainingFolder() {
    const name = path.basename(this.cwd);
    this.data.name = name;
  }

  private splitAndWriteToDisc(removeFromPj = false) {
    if (_.isObject(this.data) && this.data['']) {
      delete this.data[''];
    }
    const data = _.cloneDeep(this.data) as Models.IPackageJSON;
    const taonJsonPath = crossPlatformPath([this.cwd, config.file.taon_jsonc]);
    const isTaonProj =
      data.tnp?.type === 'isomorphic-lib' || data.tnp?.type === 'container';
    if (isTaonProj) {
      Helpers.writeJson5(taonJsonPath, data.tnp);
    }

    Helpers.removeFileIfExists(
      crossPlatformPath([this.cwd, config.file.firedev_jsonc]),
    );
    Helpers.removeFileIfExists(
      crossPlatformPath([this.cwd, config.file.devDependencies_json]),
    );
    Helpers.log(`Split done..`, 2);

    if (isTaonProj) {
      if (removeFromPj) {
        if (Helpers.isExistedSymlink(this.pathPackageJson)) {
          Helpers.log(
            `TRYING TO CHANGE CONTENT OF package.json link from :${fse.realpathSync(this.pathPackageJson)}`,
          );
        } else {
          const packageJsonData = (
            _.isObject(data) ? data : {}
          ) as Models.IPackageJSON;
          if (packageJsonData.tnp?.type === 'isomorphic-lib') {
            delete packageJsonData['main']; // TODO QUICK_FIX delete main from package.json
          }
          Helpers.writeFile(this.pathPackageJson, packageJsonData);
        }
      } else {
        if (Helpers.isExistedSymlink(this.pathPackageJson)) {
          Helpers.log(
            `TRYING TO CHANGE CONTENT OF package.json link from :${fse.realpathSync(this.pathPackageJson)}`,
          );
        } else {
          const d = (_.isObject(data) ? data : {}) as Models.IPackageJSON;
          Helpers.writeFile(this.pathPackageJson, d);
        }
      }
      Helpers.log(`Writing done..`, 2);
    }
  }

  public writeToDisc(removeFromPj = false) {
    // console.log(this.data)
    this.splitAndWriteToDisc(removeFromPj);
    // Helpers.log(`Press any key`)
    // await Helpers.pressKeyAndContinue()
  }
}
