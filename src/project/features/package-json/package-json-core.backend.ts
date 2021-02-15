//#region imports
import * as fse from 'fs-extra';
import * as path from 'path';
import * as JSON5 from 'json5';
import * as _ from 'lodash';
import * as semver from 'semver';
import chalk from 'chalk';

import { config, ConfigModels } from 'tnp-config';
import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
//#endregion

export class PackageJsonCore {
  public data: Models.npm.IPackageJSON;

  constructor(
    protected readonly cwd: string,

  ) {

  }

  get type(): ConfigModels.LibType {
    const res = this.data.tnp ? this.data.tnp.type : undefined;
    if (_.isString(res)) {
      return res;
    }
    if (this.data && this.data.name) {
      return 'unknow-npm-project';
    }
  }

  /**
   * Container only
   * linked git project
   */
  get linkedProjects(): string[] {

    const res = this.data.tnp ? this.data.tnp.linkedProjects : undefined;
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

  get frameworkVersion(): ConfigModels.FrameworkVersion {
    const res = this.data.tnp ? this.data.tnp.version : undefined;
    if (_.isString(res)) {
      return res;
    }
    return config.defaultFrameworkVersion;
  }

  get frameworks(): Models.env.UIFramework[] {
    const res = this.data.tnp &&
      _.isArray(this.data.tnp.frameworks) ? this.data.tnp.frameworks : config.frameworks;
    if (res.filter(f => !config.frameworks.includes(f)).length > 0) {
      Helpers.error(`[packagejson][frameworks] Unrecognized  frameworks`
        + ` in package.json ${JSON.stringify(this.data.tnp.frameworks)}`)
    }
    return res;
  }

  get name() {
    if (!_.isString(this.data.name)) {
      if (global.globalSystemToolMode) {
        Helpers.error(`Please define name for npm project in location: ${this.path}`, false, true)
      }
    }
    return this.data.name;
  }

  get version() {
    return this.data.version;
  }

  get resources(): string[] {
    const p = this.data.tnp;
    return Array.isArray(p.resources) ? p.resources : [];
  }

  get workspaceDependencies(): string[] {
    const p = this.data.tnp && this.data.tnp.required;
    // console.log(`${this.locationOfJson}`, p)
    return Array.isArray(p) ? p : [];
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

  get targetProjects(): Models.npm.TargetProject[] {
    const p = this.data.tnp && this.data.tnp.targetProjects;
    // console.log('asdasd',this.data.tnp.targetProjects)
    return Array.isArray(p) ? p : [];
  };

  setBuildHash(hash: string) {
    this.data.lastBuildTagHash = hash;
  }

  getBuildHash() {
    return this.data.lastBuildTagHash;
  }

  hasDependency(dependencyName: string, searchOnlyDependencies = false) {
    const deps = [
      ...Object.keys(this.data.dependencies || {}),
      ...(searchOnlyDependencies ? [] : Object.keys(this.data.devDependencies || {}))
    ];
    return deps.includes(dependencyName);
  }

  get workspaceDependenciesServers(): string[] {
    const p = this.data.tnp && this.data.tnp.requiredServers;
    // console.log(`${this.locationOfJson}`, p)
    return Array.isArray(p) ? p : [];
  }

  get additionalNpmNames() {
    const p = this.data.tnp?.additionalNpmNames;
    return _.isArray(p) ? p : [];
  }

  get path() {
    return path.join(this.cwd, config.file.package_json);
  }

  get pathToBaseline(): string {
    if (this.data && this.data.tnp &&
      (_.isString(this.data.tnp.basedOn) || _.isArray(this.data.tnp.dependsOn))
    ) {

      const pathToBaselineDependency = _.isString(_.first(this.data.tnp.dependsOn)) ?
        path.resolve(path.join(path.dirname(this.cwd), _.first(this.data.tnp.dependsOn))) : '';
      const pathToBaselineStricSite = _.isString(this.data.tnp.basedOn) ?
        path.resolve(path.join(path.dirname(this.cwd), this.data.tnp.basedOn)) : '';

      if (fse.existsSync(pathToBaselineStricSite)) {
        this.fixUnexistedBaselineInNOdeModules(pathToBaselineStricSite)
        return pathToBaselineStricSite;
      } else if (this.data.tnp.dependsOn?.length > 0 && fse.existsSync(pathToBaselineDependency)) {
        this.fixUnexistedBaselineInNOdeModules(pathToBaselineDependency);
        return pathToBaselineDependency;
      } else {
        if (_.isString(this.data.tnp.basedOn)) {
          Helpers.error(`[pathToBaseline] Wron value for ${chalk.bold('basedOn')} in package.json  (${this.cwd})`);
        } else {
          Helpers.warn(`[pathToBaseline] path to baselien not exists:
          strict-site: ${pathToBaselineStricSite}
          dependency-site: ${pathToBaselineDependency}
          `);
        }
      }

      if (!global[config.message.globalSystemToolMode] && !global.testMode) {
        Helpers.warn(`[pathToBaseline] Returning undefined to not show error message: ${this.data.tnp.basedOn} `)
        return;
      }
    }
  }

  get isCoreProject() {
    if (this.data.tnp && !_.isUndefined(this.data.tnp.isCoreProject)) {
      if (_.isBoolean(this.data.tnp.isCoreProject)) {
        return this.data.tnp.isCoreProject;
      }
      Helpers.error(`Bad value in package.json, tnp.isCoreProject should be boolean.`, true);
      Helpers.error(`Location of package.json: ${this.cwd}`)
    }
    return false;
  }

  get isGlobalSystemTool() {
    if (this.data.tnp && !_.isUndefined(this.data.tnp.isGlobalSystemTool)) {
      if (_.isBoolean(this.data.tnp.isGlobalSystemTool)) {
        return this.data.tnp.isGlobalSystemTool;
      }
      Helpers.error(`Bad value in package.json, tnp.isGlobalSystemTool should be boolean.`, true);
      Helpers.error(`Location of package.json: ${this.cwd}`)
    }
    return false;
  }

  get isCommandLineToolOnly() {
    if (this.data.tnp && !_.isUndefined(this.data.tnp.isCommandLineToolOnly)) {
      if (_.isBoolean(this.data.tnp.isCommandLineToolOnly)) {
        return this.data.tnp.isCommandLineToolOnly;
      }
      Helpers.error(`Bad value in package.json, tnp.isCommandLineToolOnly should be boolean.`, true);
      Helpers.error(`Location of package.json: ${this.cwd}`)
    }
    return false;
  }

  get isGeneratedForRelease(this: Project) {
    const p = path.basename(path.join(this.location, '../../..'))
    if (p !== config.folder.tmpBundleRelease) {
      return false;
    }
    const orgProjPath = path.resolve(path.join(this.location, '../../../..'));
    const proj = Project.From(orgProjPath);
    const res = proj && (proj.name === this.name && proj.version === this.version);
    // if (res) {
    //   console.log('fond', this.location)
    // }
    return res;
  }

  get isGenerated() {
    if (this.data.tnp && !_.isUndefined(this.data.tnp.isGenerated)) {
      if (_.isBoolean(this.data.tnp.isGenerated)) {
        return this.data.tnp.isGenerated;
      }
      Helpers.error(`[isGenerated] Bad value in package.json, tnp.isGenerated should be boolean.`, true, true);
      Helpers.error(`[isGenerated] Location of package.json: ${this.cwd}`, true, true)
    }
    return false;
  }

  get useFramework() {
    if (this.data.tnp && !_.isUndefined(this.data.tnp.useFramework)) {
      if (_.isBoolean(this.data.tnp.useFramework)) {
        return this.data.tnp.useFramework;
      }
      Helpers.error(`Bad value in package.json, tnp.useFramework should be boolean.`, true);
      Helpers.error(`Location of package.json: ${this.cwd}`);
    }
    return false;
  }

  public copyWithoutDependenciesTo(projectOrPath: Project | String) {
    this.copyTo(projectOrPath);
    const dest = path.join(_.isString(projectOrPath) ? projectOrPath :
      (projectOrPath as Project).location);
    Project.From<Project>(dest)
  }

  public copyTo(projectOrPath: Project | String) {
    if (!(_.isObject(projectOrPath) || _.isString(projectOrPath))) {
      Helpers.error(`[packagejson][copyTo] Incorrect project of path`);
    }
    const dest = path.join(_.isString(projectOrPath) ? projectOrPath :
      (projectOrPath as Project).location, config.file.package_json);

    fse.copyFileSync(this.path, dest);
  }

  public setNamFromContainingFolder() {
    const name = path.basename(this.cwd);
    this.data.name = name;
    this.writeToDisc();
  }

  private splitAndWriteToDisc(removeFromPj = false) {
    if ((['navi', 'scenario'] as ConfigModels.LibType[]).includes(this.type)) {
      Helpers.writeFile(this.path, _.isObject(this.data) ? this.data : {});
      return;
    }

    config.packageJsonSplit.forEach(c => {
      const property = c
        .replace(`${config.file.package_json}_`, '')
        .replace(`.json`, '');
      const obj = this.data[property];
      const splitPath = path.join(path.dirname(this.path), c);
      Helpers.log(`splitPath: ${splitPath}`);
      Helpers.writeFile(splitPath, _.isObject(obj) ? obj : {});
    });
    Helpers.log(`Split done..`)
    if (removeFromPj) {
      const dataToWrite = _.cloneDeep(this.data);
      config.packageJsonSplit.forEach(c => {
        const property = c
          .replace(`${config.file.package_json}_`, '')
          .replace(`.json`, '');
        delete dataToWrite[property];
      });
      Helpers.writeFile(this.path, _.isObject(dataToWrite) ? dataToWrite : {});
    } else {
      Helpers.writeFile(this.path, _.isObject(this.data) ? this.data : {});
    }

  }

  public async writeToDisc(removeFromPj = false) {
    // console.log(this.data)
    this.splitAndWriteToDisc(removeFromPj);
    // Helpers.log(`Press any key`)
    // await Helpers.pressKeyAndContinue()
  }

  public writeToDiscSync(removeFromPj = false) {
    // console.log(this.data)
    this.splitAndWriteToDisc(removeFromPj);
    // Helpers.log(`Press any key`)
    // await Helpers.pressKeyAndContinue()
  }

  private fixUnexistedBaselineInNOdeModules(pathToBaseline: string) {
    const baselineInNodeModuels = path.join(this.cwd, config.folder.node_modules, path.basename(pathToBaseline))
    if (!fse.existsSync(baselineInNodeModuels)) {
      Helpers.createSymLink(pathToBaseline, baselineInNodeModuels)
    }
  }


}
