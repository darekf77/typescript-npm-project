//#region @backend

import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import chalk from "chalk";

import { Project } from "../abstract";
import { LibType, InstalationType, IPackageJSON, DependenciesFromPackageJsonStyle } from "../../models";
import { tryRemoveDir, sortKeys as sortKeysInObjAtoZ, run, error, info, warn, log } from "../../helpers";
import { config } from '../../config';
//#endregion

import * as _ from "lodash";
import { Morphi } from 'morphi';

@Morphi.Entity<PackageJSON>({
  className: 'PackageJSON',
  //#region @backend
  createTable: false
  //#endregion
})
export class PackageJSON {

  //#region @backend

  public static fromProject(project: Project) {
    return this.fromLocation(project.location, project);
  }
  public static fromLocation(location: string, project: Project = null, warings = true): PackageJSON {

    const isTnpProject = (location === config.pathes.tnp_folder_location);
    const filePath = path.join(location, 'package.json');
    if (!fs.existsSync(filePath)) {
      // warn(`No package.json in folder: ${path.basename(location)}`)
      return;
    }
    try {
      const file = fs.readFileSync(filePath, 'utf8').toString();
      const json = JSON.parse(file);
      if (!json.tnp && !isTnpProject) {
        warn(`Unrecognized project type from location: ${location}`, false);
      }
      return new PackageJSON({ data: json, location, project });
    } catch (err) {
      error(`Error while parsing package.json in: ${filePath}`);
      error(err)
    }
  }

  public data: IPackageJSON;
  public readonly location: string;
  public readonly project: Project;
  private reasonToHidePackages: string = ''
  private reasonToShowPackages: string = ''

  get type(): LibType {
    const res = this.data.tnp ? this.data.tnp.type : undefined;
    if (_.isString(res)) {
      return res;
    }
    if (this.data && this.data.name) {
      return 'unknow-npm-project';
    }
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


  get pathToBaseline(): string {
    if (this.data && this.data.tnp &&
      (
        _.isString(this.data.tnp.basedOn) ||
        _.isString(this.data.tnp.basedOnAbsolutePath1) ||
        _.isString(this.data.tnp.basedOnAbsolutePath1)
      )
    ) {

      let p = path.join(this.location, this.data.tnp.basedOn);
      if (fs.existsSync(p)) {
        return p;
      }

      // TODO quick fix
      p = this.data.tnp.basedOnAbsolutePath1;
      if (fs.existsSync(p)) {
        return p;
      }

      p = this.data.tnp.basedOnAbsolutePath2;
      if (fs.existsSync(p)) {
        return p;
      }

      if (!global[config.message.tnp_normal_mode]) {
        return
      }

      error(`Wron value for ${chalk.bold('basedOn')} in package.json  (${this.location})

      path desn't exist: ${p}

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
      error(`Bad value in package.json, tnp.isGenerated should be boolean.`, true);
      error(`Location of package.json: ${this.location}`)
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

  show(reasonToShowPackages = '') {
    this.reasonToShowPackages = reasonToShowPackages;
    this.saveForInstall(true)
  }

  hide(reasonToHidePackages = '') {
    if (this.project.isContainer || this.project.isTnp) {
      log(`[packagejson] don't hide packages for container type or Tnp`)
      return
    }
    this.reasonToHidePackages = reasonToHidePackages;
    this.saveForInstall(false)
  }

  dedupe(packages?: string[]) {
    const packagesNames = (_.isArray(packages) && packages.length > 0) ? packages :
      Project.Tnp.packageJson.data.tnp.core.dependencies.dedupe;
    packagesNames.forEach(f => {
      log(`Scanning for duplicates fo ${f}....`)

      const res = run(`find ${config.folder.node_modules}/ -name ${f} `, { output: false }).sync().toString()
      const duplicates = res
        .split('\n')
        .map(l => l.replace(/\/\//g, '/'))
        .filter(l => !!l)
        .filter(l => !l.startsWith(`${config.folder.node_modules}/${f}`))
        .filter(l => !l.startsWith(`${config.folder.node_modules}/${config.folder._bin}`))
        .filter(l => path.basename(path.dirname(l)) === config.folder.node_modules)
      // const duplicates = glob.sync(`/**/${f}`, {
      //   cwd: path.join(this.location, config.folder.node_modules),
      //   follow: false,
      // })
      // log(duplicates)
      duplicates.forEach(duplicateRelativePath => {
        const p = path.join(this.location, duplicateRelativePath)
        tryRemoveDir(p)
        info(`Duplicate of ${f} removed from ${p}`)
      })
    })

  }

  updateHooks() {
    if (!(this.data.husky && this.data.husky.hooks && _.isString(this.data.husky.hooks["pre-push"]))) {
      this.data.husky = {
        hooks: {
          "pre-push": "tnp deps:show:if:standalone"
        }
      }
      this.save()
    }
  }

  save() {
    const filePath = path.join(this.location, config.file.package_json);
    fse.writeJSONSync(filePath, this.data, {
      encoding: 'utf8',
      spaces: 2
    });
    // info('package.json saved')
  }

  public coreRecreate() {
    const coreProject = Project.Tnp;
    const addedDeps = coreProject.packageJson.data.dependencies;
    const addedDevDeps = coreProject.packageJson.data.devDependencies;
    const deps = _.merge({}, addedDeps, addedDevDeps);
    const coreDeps = this.getDepsBy(undefined, (obj, pkgName) => {
      if (deps[pkgName]) {
        obj[pkgName] = deps[pkgName];
      }
      return obj[pkgName];
    });
    coreProject.packageJson.save()
    coreProject.packageJson.reload()
    coreProject.packageJson.saveForInstall(false, false)
  }


  private saveForInstall(showPackagesinFile = true, coreRecreate = true) {
    // log(`save for install in ${this.project.name} ! `)
    if (coreRecreate) {
      this.coreRecreate()
    }
    this.reload()
    if (this.project.isWorkspace || this.project.isWorkspaceChildProject || this.project.isContainer) {
      this.recreateForWorkspaceOrContainer(showPackagesinFile)
    } else if (this.project.isStandaloneProject) {
      this.recreateForStandalone(showPackagesinFile)
    }
  }

  private travelObject(obj: Object, out: Object, parent: Object, updateFn?: (obj: Object, pkgName: string) => string) {
    Object.keys(obj).forEach(key => {
      if (key !== '@') {
        if (!_.isArray(obj[key])) {
          if (_.isObject(obj[key])) {
            this.travelObject(obj[key], out, obj[key], updateFn);
          } else {
            if (_.isString(out[key])) {
              error(`Duplicate key in workspace package.json tnp.core packages configuration:
                "${key}": "${out[key]}"
              `);
            }
            if (_.isFunction(updateFn)) {
              out[key] = updateFn(obj, key);
            } else {
              out[key] = obj[key]
            }
          }
        }
      } else if (!!parent) {
        this.travelObject(parent[key], out, parent, updateFn)
      }
    })
  }

  private restrictVersions(obj: DependenciesFromPackageJsonStyle) {
    Object.keys(obj).forEach(name => {
      if (obj[name].startsWith('^')) {
        obj[name] = obj[name].slice(1)
      }
      if (obj[name].startsWith('~')) {
        obj[name] = obj[name].slice(1)
      }
    })
  }

  private getDepsBy(type: LibType = undefined, updateFn?: (obj: Object, pkgName: string) => string) {
    const core = Project.Tnp.packageJson.data.tnp.core.dependencies;
    let newDeps = {};
    this.travelObject(core.common, newDeps, undefined, updateFn);
    if (_.isString(type)) {
      this.travelObject(core.onlyFor[type], newDeps, core.onlyFor, updateFn);
    } else {
      Object.keys(core.onlyFor).forEach(libType => {
        this.travelObject(core.onlyFor[libType], newDeps, undefined, updateFn);
      })
    }
    return newDeps;
  }

  private overrideLef(project: Project, name: string, version: string) {
    if (!project.packageJson.data.tnp.overrided) {
      project.packageJson.data.tnp.overrided = {};
    }
    if (!project.packageJson.data.tnp.overrided.dependencies) {
      project.packageJson.data.tnp.overrided.dependencies = {}
    }
    project.packageJson.data.tnp.overrided.dependencies[name] = version;
  }

  private modifyWrapper(newDeps, project: Project, recrateInPackageJson: boolean, allDeps) {
    const oldDependencies = !project.packageJson.data.dependencies ? {} : _.cloneDeep(project.packageJson.data.dependencies) as DependenciesFromPackageJsonStyle;
    const toOverride = (project.packageJson.data.tnp.overrided &&
      project.packageJson.data.tnp.overrided.dependencies) ?
      project.packageJson.data.tnp.overrided.dependencies : {}

    // log('toOverride',toOverride)

    _.merge(newDeps, toOverride);
    Object.keys(newDeps).forEach(key => {
      if (_.isNull(newDeps[key])) {
        newDeps[key] = undefined;
      }
    })

    Object.keys(oldDependencies).forEach(oldDepName => {
      if (!newDeps[oldDepName]) {

        if (allDeps[oldDepName]) {
          log(`Move from other lib type dependencies  : "${oldDepName}":"${oldDependencies[oldDepName]}" to ${project.type} `)
          this.overrideLef(project, oldDepName, oldDependencies[oldDepName]);
        } else {
          log(`Overrided dependency  : "${oldDepName}":"${oldDependencies[oldDepName]}" saved in override.dependencies`)
          this.overrideLef(project, oldDepName, oldDependencies[oldDepName]);
        }

      }

      if (toOverride && toOverride[oldDepName] && oldDependencies[oldDepName] !== newDeps[oldDepName]) {
        log(`Overrided from "${oldDepName}":  "${oldDependencies[oldDepName]}"=>"${newDeps[oldDepName]}"`)
      } else if (newDeps[oldDepName] && newDeps[oldDepName] !== oldDependencies[oldDepName]) {
        log(`Version change for "${oldDepName}":  "${oldDependencies[oldDepName]}"=>"${newDeps[oldDepName]}"`)
      }
    })


    this.cleanBeforeSave(project, newDeps, toOverride);
    // this.inlcudeDevDevs(project)

    const engines = Project.Tnp.packageJson.data.engines;
    const license = project.isStandaloneProject ? 'MIT' : 'UNLICENSED';

    if (project.isStandaloneProject) {

      if (recrateInPackageJson) {
        log(`[package.json] save for install - standalone project: "${this.project.name}" , [${this.reasonToShowPackages}]`)
        project.packageJson.data.devDependencies = sortKeysInObjAtoZ(this.filterDevDepOnly(_.cloneDeep(newDeps)))
        project.packageJson.data.dependencies = sortKeysInObjAtoZ(this.filterDepOnly(_.cloneDeep(newDeps)))
        project.packageJson.data.engines = engines;
        project.packageJson.data.license = license;
        project.packageJson.save()
      } else {
        log(`[package.json] save for clean - standalone project: "${this.project.name}" , [${this.reasonToHidePackages}]`)
        project.packageJson.data.devDependencies = undefined;
        project.packageJson.data.dependencies = undefined;
        project.packageJson.data.engines = undefined
        project.packageJson.data.license = undefined;
        project.packageJson.save()
      }

    } else {
      project.packageJson.data.devDependencies = undefined;
      if (recrateInPackageJson) {
        log(`[package.json] save for install - workspace project: "${this.project.name}" , [${this.reasonToShowPackages}]`)
        project.packageJson.data.dependencies = sortKeysInObjAtoZ(newDeps)
        if (!project.isCoreProject) {
          project.packageJson.data.engines = engines;
          project.packageJson.data.license = license;
        }
        project.packageJson.save()
      } else {
        log(`[package.json] save for clean - workspace project: "${this.project.name}" , [${this.reasonToHidePackages}]`)
        project.packageJson.data.dependencies = undefined;
        if (!project.isCoreProject) {
          project.packageJson.data.engines = undefined;
          project.packageJson.data.license = undefined;
        }
        project.packageJson.save()
      }
    }


  }


  private filterDevDepOnly(deps: DependenciesFromPackageJsonStyle) {
    const devDeps = Project.Tnp.packageJson.data.tnp.core.dependencies.asDevDependencies;
    let onlyAsDevAllowed = (this.project.packageJson.data.tnp && this.project.packageJson.data.tnp.overrided && this.project.packageJson.data.tnp.overrided.includeAsDev) || [];
    let allDeps = this.getDepsBy();

    // log('d1evDeps', devDeps)
    Object.keys(deps).forEach(name => {
      if (!devDeps.includes(name)) {
        deps[name] = undefined;
      }
    })

    Object.keys(allDeps).forEach(name => {
      if (onlyAsDevAllowed.includes(name) || onlyAsDevAllowed.filter(d => (new RegExp(d)).test(name)).length > 0) {
        deps[name] = allDeps[name]
      }
    })

    return deps;
  }

  private filterDepOnly(deps: DependenciesFromPackageJsonStyle) {
    const devDeps = Project.Tnp.packageJson.data.tnp.core.dependencies.asDevDependencies;
    let onlyAsDevAllowed = (this.project.packageJson.data.tnp
      && this.project.packageJson.data.tnp.overrided
      && this.project.packageJson.data.tnp.overrided.includeAsDev) || [];

    // log('d2evDeps', devDeps)
    Object.keys(deps).forEach(name => {
      if (devDeps.includes(name) || onlyAsDevAllowed.includes(name) || onlyAsDevAllowed.filter(f => (new RegExp(f)).test(name)).length > 0) {
        deps[name] = undefined;
      }
    })
    return deps;
  }


  private cleanBeforeSave(project: Project, deps: DependenciesFromPackageJsonStyle, overrided: DependenciesFromPackageJsonStyle) {
    // log('overrided', overrided)

    deps[project.name] = undefined;

    if (project.packageJson.data.tnp &&
      project.packageJson.data.tnp.overrided &&
      _.isArray(project.packageJson.data.tnp.overrided.includeOnly)) {

      let onlyAllowed = project.packageJson.data.tnp.overrided.includeOnly;

      onlyAllowed = onlyAllowed.concat(Project.Tnp
        .packageJson.data.tnp.core.dependencies.always);

      Object.keys(deps).forEach(depName => {
        if (!onlyAllowed.includes(depName)) {
          deps[depName] = undefined;
        }
      });

      return
    }


    if (project.packageJson.data.tnp &&
      project.packageJson.data.tnp.overrided &&
      _.isArray(project.packageJson.data.tnp.overrided.ignoreDepsPattern)) {
      const patterns = project.packageJson.data.tnp.overrided.ignoreDepsPattern;
      patterns.forEach(p => {
        Object.keys(deps).forEach(depName => {
          // log(`check patter: ${p} agains ${depName}`)
          if ((new RegExp(p)).test(depName) && !overrided[depName]) {
            deps[depName] = undefined;
          }
        })
      })

    }
  }

  private recreateForWorkspaceOrContainer(recreateInPackageJson: boolean) {
    let allDeps = this.getDepsBy();
    const workspace = (this.project.isWorkspace || this.project.isContainer) ? this.project : (this.project.isWorkspaceChildProject ? this.project.parent : undefined)
    this.modifyWrapper(allDeps, workspace, recreateInPackageJson, allDeps)
  }

  private recreateForStandalone(recreateInPackageJson: boolean) {
    let allDeps = this.getDepsBy();
    let newDeps = this.getDepsBy(this.project.isTnp ? void 0 : this.project.type);
    this.modifyWrapper(newDeps, this.project, recreateInPackageJson, allDeps);
  }

  private reload() {
    try {
      const file = fs.readFileSync(path.join(this.location, config.file.package_json), 'utf8').toString();
      const json = JSON.parse(file);
      if (!json.tnp) {
        warn(`Unrecognized project type from package.json in location: ${location}`, false);
      }
      this.data = json;
    } catch (e) {
      error(`Error during reload package.json from ${this.location}
        ${e}
      `)
    }
  }


  //#endregion

}

