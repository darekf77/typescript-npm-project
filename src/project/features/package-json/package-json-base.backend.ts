
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as JSON5 from 'json5';
import chalk from 'chalk';

import { Project } from '../../abstract';
import { LibType, IPackageJSON, DependenciesFromPackageJsonStyle, UIFramework, Package } from '../../../models';
import { tryRemoveDir, sortKeys as sortKeysInObjAtoZ, run, error, info, warn, log, HelpersLinks } from '../../../helpers';
import { config } from '../../../config';



import * as _ from 'lodash';
import { Morphi } from 'morphi';
import { getAndTravelCoreDeps, reolveAndSaveDeps } from './package-json-helpers.backend';




export class PackageJsonBase {

  public data: IPackageJSON;
  public readonly location: string;
  public readonly project: Project;
  private reasonToHidePackages: string = ''
  private reasonToShowPackages: string = ''

  //#region getters
  get type(): LibType {
    const res = this.data.tnp ? this.data.tnp.type : undefined;
    if (_.isString(res)) {
      return res;
    }
    if (this.data && this.data.name) {
      return 'unknow-npm-project';
    }
  }

  get frameworks(): UIFramework[] {
    const res = this.data.tnp &&
      _.isArray(this.data.tnp.frameworks) ? this.data.tnp.frameworks : config.frameworks;
    if (res.filter(f => !config.frameworks.includes(f)).length > 0) {
      error(`[packagejson][frameworks] Unrecognized  frameworks`
        + ` in package.json ${JSON.stringify(this.data.tnp.frameworks)}`)
    }
    return res;
  }

  get name() {
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

  get locationOfJson() {
    return path.join(this.location, config.file.package_json);
  }

  get pathToBaseline(): string {
    if (this.data && this.data.tnp &&
      (
        _.isString(this.data.tnp.basedOn) ||
        _.isString(this.data.tnp.basedOnAbsolutePath1) ||
        _.isString(this.data.tnp.basedOnAbsolutePath1)
      )
    ) {

      let pathToBaseline = path.resolve(path.join(path.dirname(this.location), this.data.tnp.basedOn));
      if (fse.existsSync(pathToBaseline)) {
        this.fixUnexistedBaselineInNOdeModules(pathToBaseline)
        return pathToBaseline;
      }
      warn(`pathToBaseline not exists: ${pathToBaseline}`)

      // QUICK_FIX
      pathToBaseline = this.data.tnp.basedOnAbsolutePath1;
      if (fs.existsSync(pathToBaseline)) {
        this.fixUnexistedBaselineInNOdeModules(pathToBaseline)
        return pathToBaseline;
      }
      warn(`pathToBaseline not exists: ${pathToBaseline}`)

      pathToBaseline = this.data.tnp.basedOnAbsolutePath2;
      if (fs.existsSync(pathToBaseline)) {
        this.fixUnexistedBaselineInNOdeModules(pathToBaseline)
        return pathToBaseline;
      }
      warn(`pathToBaseline not exists: ${pathToBaseline}`)

      if (!global[config.message.tnp_normal_mode] && !global.testMode) {
        warn(`[tnp][isSite] Returning undefined to not show error message: ${this.data.tnp.basedOn} `)
        return;
      }
      console.log('DATA TNP', this.data.tnp)
      error(`Wron value for ${chalk.bold('basedOn')} in package.json  (${this.location})

      path desn't exist: ${pathToBaseline}

      `)
    }
  }

  get isCoreProject() {
    if (this.data.tnp && !_.isUndefined(this.data.tnp.isCoreProject)) {
      if (_.isBoolean(this.data.tnp.isCoreProject)) {
        return this.data.tnp.isCoreProject;
      }
      error(`Bad value in package.json, tnp.isCoreProject should be boolean.`, true);
      error(`Location of package.json: ${this.location}`)
    }
    return false;
  }

  get isCommandLineToolOnly() {
    if (this.data.tnp && !_.isUndefined(this.data.tnp.isCommandLineToolOnly)) {
      if (_.isBoolean(this.data.tnp.isCommandLineToolOnly)) {
        return this.data.tnp.isCommandLineToolOnly;
      }
      error(`Bad value in package.json, tnp.isCommandLineToolOnly should be boolean.`, true);
      error(`Location of package.json: ${this.location}`)
    }
    return false;
  }

  get isGenerated() {
    if (this.data.tnp && !_.isUndefined(this.data.tnp.isGenerated)) {
      if (_.isBoolean(this.data.tnp.isGenerated)) {
        return this.data.tnp.isGenerated;
      }
      error(`[isGenerated] Bad value in package.json, tnp.isGenerated should be boolean.`, true, true);
      error(`[isGenerated] Location of package.json: ${this.location}`, true, true)
    }
    return false;
  }


  get useFramework() {
    if (this.data.tnp && !_.isUndefined(this.data.tnp.useFramework)) {
      if (_.isBoolean(this.data.tnp.useFramework)) {
        return this.data.tnp.useFramework;
      }
      error(`Bad value in package.json, tnp.useFramework should be boolean.`, true);
      error(`Location of package.json: ${this.location}`)
    }
    return false;
  }
  //#endregion

  constructor(options: { data: Object, location?: string; project?: Project; }) {
    if (_.isObject(options)) {
      if (options.project && !options.location) {
        options.location = options.project.location;
      }
      _.merge(this, options);

      this.data = _.merge({
        tnp: {
          resources: []
        }
      } as IPackageJSON, options.data as any);
    }

  }

  private fixUnexistedBaselineInNOdeModules(pathToBaseline: string) {
    const baselineInNodeModuels = path.join(this.location, config.folder.node_modules, path.basename(pathToBaseline))
    if (!fse.existsSync(baselineInNodeModuels)) {
      HelpersLinks.createSymLink(pathToBaseline, baselineInNodeModuels)
    }
  }

  public copyTo(project: Project) {
    const packageJsonloCation = path.join(this.project.location, config.file.package_json);
    const dest = path.join(project.location, config.file.package_json);
    fse.copyFileSync(packageJsonloCation, dest);
  }

  public writeToDisc() {
    const filePath = path.join(this.location, config.file.package_json);
    fse.writeJSONSync(filePath, this.data, {
      encoding: 'utf8',
      spaces: 2
    });
  }

  public save(reasonToShowPackages: string) {
    this.reasonToShowPackages = `\n${reasonToShowPackages}`;
    if (!this.project.isUnknowNpmProject && !this.project.isContainer) {
      this.prepareForSave();
    }
    this.writeToDisc();
  }

  public hideDeps(reasonToHidePackages: string) {
    this.reasonToHidePackages = `\n${reasonToHidePackages}`;
    this.prepareForSave(false);
    this.writeToDisc();
  }

  public updateHooks() {
    if (!(this.data.husky && this.data.husky.hooks && _.isString(this.data.husky.hooks['pre-push']))) {
      this.data.husky = {
        hooks: {
          'pre-push': 'tnp deps:show:if:standalone'
        }
      }
      this.save('Update hooks');
    }
  }

  private prepareForSave(showPackagesinFile = true) {

    if (!showPackagesinFile && this.project.isTnp) {
      showPackagesinFile = true;
    }

    if (this.project.isWorkspace || this.project.isWorkspaceChildProject || this.project.isContainer) {
      this.recreateForWorkspaceOrContainer(showPackagesinFile)
    } else if (this.project.isStandaloneProject) {
      this.recreateForStandalone(showPackagesinFile)
    }
  }


  private restrictVersions(obj: DependenciesFromPackageJsonStyle) {
    Object.keys(obj).forEach(name => {
      if (obj[name].startsWith('^')) {
        obj[name] = obj[name].slice(1)
      }
      if (obj[name].startsWith('~')) {
        obj[name] = obj[name].slice(1)
      }
    });
  }


  private recreateForWorkspaceOrContainer(recreateInPackageJson: boolean) {
    const workspace = (this.project.isWorkspace || this.project.isContainer) ?
      this.project : (this.project.isWorkspaceChildProject ? this.project.parent : undefined)
    reolveAndSaveDeps(workspace, recreateInPackageJson, this.reasonToHidePackages, this.reasonToShowPackages);
  }

  private recreateForStandalone(recreateInPackageJson: boolean) {
    reolveAndSaveDeps(this.project, recreateInPackageJson, this.reasonToHidePackages, this.reasonToShowPackages);
  }

  public removeDependency = (p: Package, reason: string) => removeDependency(p, reason, this.project);
  public setDependencyAndSave = (p: Package, reason: string) => setDependencyAndSave(p, reason, this.project);

}

function removeDependency(p: Package, reason: string, project: Project) {

  if (!p || !p.name) {
    error(`Cannot remove invalid dependency for project ${project.genericName}: ${JSON5.stringify(p)}`, false, true);
  }
  project = (project.isWorkspaceChildProject ? project.parent : project);
  if (project.isTnp) {
    getAndTravelCoreDeps({
      updateFn: (obj, pkgName) => {
        if (pkgName === p.name) {
          obj[pkgName] = void 0;
        }
        return obj[pkgName];
      }
    });
  }
  if (project.isUnknowNpmProject) {
    project.packageJson.data.dependencies[p.name] = void 0;
    project.packageJson.data.devDependencies[p.name] = void 0;
  } else {
    if (project.packageJson.data.tnp.overrided.dependencies[p.name]) {
      project.packageJson.data.tnp.overrided.dependencies[p.name] = null;
    }
  }

  project.packageJson.save(`[${reason}] [removeDependency] name:${p && p.name} in project ${
    project && project.genericName
    }`);
}


function setDependencyAndSave(p: Package, reason: string, project: Project, ) {
  if (!p || !p.name) {
    error(`Cannot set invalid dependency for project ${project.genericName}: ${JSON5.stringify(p)}`, false, true);
  }
  project = (project.isWorkspaceChildProject ? project.parent : project);

  if (project.isTnp && !_.isString(p.version)) {
    try {
      p.version = run(`npm show ${p.name} version`, { output: false }).sync().toString().trim();
    } catch (e) {
      error(`No able to find package with name ${p.name}`, false, true);
    }
  }

  if (project.isTnp) {
    let updated = false;
    getAndTravelCoreDeps({
      updateFn: (obj, pkgName) => {
        if (pkgName === p.name) {
          obj[pkgName] = p.version;
          updated = true;
        }
        return obj[pkgName];
      }
    });
    if (!updated) {
      project.packageJson.data.tnp.overrided.dependencies[p.name] = p.version;
    }
  } else if (project.isContainer) {
    error(`Instalation not suported`, false, true);
  } else if (project.isUnknowNpmProject) {
    if (p.installType === '--save') {
      if (!project.packageJson.data.dependencies) {
        project.packageJson.data.dependencies = {};
      }
      project.packageJson.data.dependencies[p.name] = p.version;
    } else if (p.installType === '--save-dev') {
      if (!project.packageJson.data.devDependencies) {
        project.packageJson.data.devDependencies = {};
      }
      project.packageJson.data.devDependencies[p.name] = p.version;
    }
  } else if (project.isStandaloneProject || project.isWorkspace || project.isWorkspaceChildProject) {
    if (p.version) {
      delete project.packageJson.data.tnp.overrided.dependencies[p.name];
    } else {
      project.packageJson.data.tnp.overrided.dependencies[p.name] = p.version;
    }
  }
  project.packageJson.save(`[${reason}] [setDependency] name:${p && p.name}, ver:${p && p.version} in project ${
    project && project.genericName
    }`);
}
