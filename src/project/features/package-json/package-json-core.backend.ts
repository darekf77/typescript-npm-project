//#region imports
import * as fse from 'fs-extra';
import * as path from 'path';
import * as JSON5 from 'json5';
import * as _ from 'lodash';
import * as semver from 'semver';
import chalk from 'chalk';

import { config } from '../../../config';
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

  get type(): Models.libs.LibType {
    const res = this.data.tnp ? this.data.tnp.type : undefined;
    if (_.isString(res)) {
      return res;
    }
    if (this.data && this.data.name) {
      return 'unknow-npm-project';
    }
  }

  get linkedProjects() {

    const res = this.data.tnp ? this.data.tnp.linkedProjects : undefined;
    if (_.isArray(res)) {
      return res;
    }
    return [];
  }

  get frameworkVersion(): Models.libs.FrameworkVersion {
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
      if (global.tnp_normal_mode) {
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

  get workspaceDependenciesServers(): string[] {
    const p = this.data.tnp && this.data.tnp.requiredServers;
    // console.log(`${this.locationOfJson}`, p)
    return Array.isArray(p) ? p : [];
  }

  get path() {
    return path.join(this.cwd, config.file.package_json);
  }

  get pathToBaseline(): string {
    if (this.data && this.data.tnp &&
      (
        _.isString(this.data.tnp.basedOn)
      )
    ) {

      let pathToBaseline = path.resolve(path.join(path.dirname(this.cwd), this.data.tnp.basedOn));
      if (fse.existsSync(pathToBaseline)) {
        this.fixUnexistedBaselineInNOdeModules(pathToBaseline)
        return pathToBaseline;
      }
      Helpers.warn(`pathToBaseline not exists: ${pathToBaseline}`)

      if (fse.existsSync(pathToBaseline)) {
        this.fixUnexistedBaselineInNOdeModules(pathToBaseline)
        return pathToBaseline;
      }
      Helpers.warn(`pathToBaseline not exists: ${pathToBaseline}`)

      // pathToBaseline = this.data.tnp.basedOnAbsolutePath2;
      if (fse.existsSync(pathToBaseline)) {
        this.fixUnexistedBaselineInNOdeModules(pathToBaseline)
        return pathToBaseline;
      }
      Helpers.warn(`pathToBaseline not exists: ${pathToBaseline}`)

      if (!global[config.message.tnp_normal_mode] && !global.testMode) {
        Helpers.warn(`[tnp][isSiteInStrictMode] Returning undefined to not show error message: ${this.data.tnp.basedOn} `)
        return;
      }
      console.log('DATA TNP', this.data.tnp)
      Helpers.error(`Wron value for ${chalk.bold('basedOn')} in package.json  (${this.cwd})

      path desn't exist: ${pathToBaseline}

      `, false, true);
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
    Project.From(dest)
  }

  public copyTo(projectOrPath: Project | String) {
    if (!(_.isObject(projectOrPath) || _.isString(projectOrPath))) {
      Helpers.error(`[packagejson][copyto] Incorrect project of path`);
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

  public async writeToDisc() {
    // console.log(this.data)
    fse.writeJSONSync(this.path, this.data, {
      encoding: 'utf8',
      spaces: 2
    });

    // Helpers.log(`Press any key`)
    // await Helpers.pressKeyAndContinue()
  }

  public writeToDiscSync() {
    // console.log(this.data)
    fse.writeJSONSync(this.path, this.data, {
      encoding: 'utf8',
      spaces: 2
    });

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
