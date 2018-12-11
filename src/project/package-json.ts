//#region @backend
import * as _ from "lodash";
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';

import {
  LibType, InstalationType, BuildOptions,
  Dependencies, Package, IPackageJSON, DependenciesFromPackageJsonStyle
} from "../models";
import { error, info, warn } from "../messages";
import { run } from "../process";
import { Project } from "./base-project";
import { ProjectFrom } from "./index";
import chalk from "chalk";
import { config } from '../config';
import { Helpers } from 'morphi';
import { tryRemoveDir } from '../helpers';

const sortKeys = function (obj) {
  if (_.isArray(obj)) {
    return obj.map(sortKeys);
  }
  if (_.isObject(obj)) {
    return _.fromPairs(_.keys(obj).sort().map(key => [key, sortKeys(obj[key])]));
  }
  return obj;
};


export class PackageJSON {

  public data: IPackageJSON;
  public readonly location: string;
  public readonly project: Project;


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
    const core = Project.by('workspace').packageJson.data.tnp.core.dependencies;
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

  private modifyWrapper(newDeps, project: Project, saveForInstall: boolean, allDeps) {
    const oldDependencies = !project.packageJson.data.dependencies ? {} : _.cloneDeep(project.packageJson.data.dependencies) as DependenciesFromPackageJsonStyle;
    const toOverride = (project.packageJson.data.tnp.overrided &&
      project.packageJson.data.tnp.overrided.dependencies) ?
      project.packageJson.data.tnp.overrided.dependencies : {}

    // console.log('toOverride',toOverride)

    _.merge(newDeps, toOverride);
    Object.keys(newDeps).forEach(key => {
      if (_.isNull(newDeps[key])) {
        newDeps[key] = undefined;
      }
    })

    Object.keys(oldDependencies).forEach(oldDepName => {
      if (!newDeps[oldDepName]) {

        if (allDeps[oldDepName]) {
          console.log(`Move from other lib type dependencies  : "${oldDepName}":"${oldDependencies[oldDepName]}" to ${project.type} `)
          this.overrideLef(project, oldDepName, oldDependencies[oldDepName]);
        } else {
          console.log(`Overrided dependency  : "${oldDepName}":"${oldDependencies[oldDepName]}" saved in override.dependencies`)
          this.overrideLef(project, oldDepName, oldDependencies[oldDepName]);
        }

      }

      if (toOverride && toOverride[oldDepName] && oldDependencies[oldDepName] !== newDeps[oldDepName]) {
        console.log(`Overrided from "${oldDepName}":  "${oldDependencies[oldDepName]}"=>"${newDeps[oldDepName]}"`)
      } else if (newDeps[oldDepName] && newDeps[oldDepName] !== oldDependencies[oldDepName]) {
        console.log(`Version change for "${oldDepName}":  "${oldDependencies[oldDepName]}"=>"${newDeps[oldDepName]}"`)
      }
    })


    this.cleanBeforeSave(project, newDeps, toOverride);
    // this.inlcudeDevDevs(project)

    const engines = Project.by('workspace').packageJson.data.engines;
    const license = project.isStandaloneProject ? 'MIT' : 'UNLICENSED';

    if (project.isStandaloneProject) {

      if (saveForInstall) {
        info('save for install - standalone project')
        project.packageJson.data.devDependencies = sortKeys(this.filterDevDepOnly(_.cloneDeep(newDeps)))
        project.packageJson.data.dependencies = sortKeys(this.filterDepOnly(_.cloneDeep(newDeps)))
        project.packageJson.data.engines = engines;
        project.packageJson.data.license = license;
        project.packageJson.save()
      } else {
        info('save for clean version - standalone project')
        project.packageJson.data.devDependencies = undefined;
        project.packageJson.data.dependencies = undefined;
        project.packageJson.data.engines = undefined
        project.packageJson.data.license = undefined;
        project.packageJson.save()
      }

    } else {
      project.packageJson.data.devDependencies = undefined;
      if (saveForInstall) {
        info('save for install - workspace project')
        project.packageJson.data.dependencies = sortKeys(newDeps)
        if (!project.isCoreProject) {
          project.packageJson.data.engines = engines;
          project.packageJson.data.license = license;
        }
        project.packageJson.save()
      } else {
        info('save for clean version - workspace project')
        project.packageJson.data.dependencies = undefined;
        if (!project.isCoreProject) {
          project.packageJson.data.engines = undefined;
          project.packageJson.data.license = undefined;
        }
        project.packageJson.save()
      }
    }


  }


  filterDevDepOnly(deps: DependenciesFromPackageJsonStyle) {
    const devDeps = Project.by('workspace').packageJson.data.tnp.core.dependencies.asDevDependencies;
    let onlyAsDevAllowed = this.project.packageJson.data.tnp.overrided.includeAsDev || [];
    let allDeps = this.getDepsBy();

    // console.log('d1evDeps', devDeps)
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

  filterDepOnly(deps: DependenciesFromPackageJsonStyle) {
    const devDeps = Project.by('workspace').packageJson.data.tnp.core.dependencies.asDevDependencies;
    let onlyAsDevAllowed = this.project.packageJson.data.tnp.overrided.includeAsDev || [];
    // console.log('d2evDeps', devDeps)
    Object.keys(deps).forEach(name => {
      if (devDeps.includes(name) || onlyAsDevAllowed.includes(name) || onlyAsDevAllowed.filter(f => (new RegExp(f)).test(name)).length > 0) {
        deps[name] = undefined;
      }
    })
    return deps;
  }


  cleanBeforeSave(project: Project, deps: DependenciesFromPackageJsonStyle, overrided: DependenciesFromPackageJsonStyle) {
    // console.log('overrided', overrided)

    deps[project.name] = undefined;

    if (project.packageJson.data.tnp &&
      project.packageJson.data.tnp.overrided &&
      _.isArray(project.packageJson.data.tnp.overrided.includeOnly)) {

      let onlyAllowed = project.packageJson.data.tnp.overrided.includeOnly;

      onlyAllowed = onlyAllowed.concat(Project.by('workspace')
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
          // console.log(`check patter: ${p} agains ${depName}`)
          if ((new RegExp(p)).test(depName) && !overrided[depName]) {
            deps[depName] = undefined;
          }
        })
      })

    }
  }

  private recreateForWorkspace(saveForInstall: boolean) {
    let allDeps = this.getDepsBy();
    const workspace = this.project.isWorkspace ? this.project : (this.project.isWorkspaceChildProject ? this.project.parent : undefined)
    this.modifyWrapper(allDeps, workspace, saveForInstall, allDeps)
  }

  private recreateForStandalone(saveForInstall: boolean) {
    let allDeps = this.getDepsBy();
    let newDeps = this.getDepsBy(this.project.type);
    this.modifyWrapper(newDeps, this.project, saveForInstall, allDeps);
  }

  saveForInstall(saveForInstall = true, coreRecreate = true) {
    console.log(`save for install in ${this.project.name} ! `)
    if (coreRecreate) {
      this.coreRecreate()
    }
    this.reload()
    if (this.project.isWorkspace || this.project.isWorkspaceChildProject) {
      this.recreateForWorkspace(saveForInstall)
    } else if (this.project.isStandaloneProject) {
      this.recreateForStandalone(saveForInstall)
    }
  }

  coreRecreate() {
    const coreProject = Project.by('workspace');
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

  dedupe() {
    const packagesNames = Project.by('workspace').packageJson.data.tnp.core.dependencies.dedupe;
    packagesNames.forEach(f => {
      console.log(`Scanning for duplicates fo ${f}....`)

      const res = run(`find ${config.folder.node_modules}/ -name ${f} `, { output: false }).sync().toString()
      const duplicates = res
        .split('\n')
        .map(l => l.replace(/\/\//g, '/'))
        .filter(l => !!l)
        .filter(l => !l.startsWith(`${config.folder.node_modules}/${f}`))
        .filter(l => !l.startsWith(`${config.folder.node_modules}/.${config.file.bin}`))
        .filter(l => path.basename(path.dirname(l)) === config.folder.node_modules)
      // const duplicates = glob.sync(`/**/${f}`, {
      //   cwd: path.join(this.location, config.folder.node_modules),
      //   follow: false,
      // })
      // console.log(duplicates)
      duplicates.forEach(duplicateRelativePath => {
        const p = path.join(this.location, duplicateRelativePath)
        tryRemoveDir(p)
        info(`Duplicate of ${f} removed from ${p}`)
      })
    })

  }

  update() {

  }



  save() {
    const filePath = path.join(this.location, config.file.package_json);
    fse.writeJSONSync(filePath, this.data, {
      encoding: 'utf8',
      spaces: 2
    });
    info('package.json saved')
  }

  constructor(options: { data: Object, location?: string; project?: Project; }) {
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

  installPackage(packageName?: string) {
    const type: InstalationType = '--save';
    // console.log('packageName', packageName)
    // console.log(this.location)
    const yarnLock = path.join(this.location, 'yarn.lock');
    if (fs.existsSync(yarnLock)) {
      info(`Installing npm packge: "${packageName}" with yarn.`)
      run(`yarn add ${packageName} ${type}`, { cwd: this.location }).sync()
    } else {
      info(`Installing npm packge: "${packageName}" with npm.`)
      run(`npm i ${packageName} ${type}`, { cwd: this.location }).sync()
    }
  }

  public static fromProject(project: Project) {
    return this.fromLocation(project.location, project);
  }
  public static fromLocation(location: string, project: Project = null): PackageJSON {

    const isTnpProject = (location === path.join(__dirname, '..'));
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




  // get requiredProjects(): Project[] {
  //   const projects: Project[] = [];
  //   if (this.data && this.data.tnp && Array.isArray(this.data.tnp.requiredLibs)) {
  //     const dependencies = this.data.tnp.requiredLibs;
  //     dependencies.forEach(p => {
  //       const projectPath = path.join(this.location, p);
  //       if (!fs.existsSync(projectPath)) {
  //         error(`Dependency project: "${p}" doesn't exist.`)
  //       }
  //       projects.push(ProjectFrom(projectPath));
  //     })
  //   }
  //   return projects;
  // }

  get type(): LibType {
    const res = this.data.tnp ? this.data.tnp.type : undefined;
    if (_.isString(res)) {
      return res;
    }
    if (!res && fs.existsSync(path.join(this.location, 'angular-cli.json'))) {
      return 'angular-cli';
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


      error(`Wron value for ${chalk.bold('basedOn')} in package.json  (${this.location})

      path desn't exist: ${p}

      `)
    }
  }

  // get basedOn(): Project {
  //   // console.log(this.data)
  //   if (this.data.tnp && this.data.tnp.basedOn) {
  //     if (!_.isString(this.data.tnp.basedOn)) {
  //       error(`Wron value for ${chalk.bold('basedOn')} in package.json  (${this.location})`)
  //     }
  //     const baseline = ProjectFrom(path.join(this.location, this.data.tnp.basedOn as string));
  //     if (baseline && baseline.type !== 'workspace') {
  //       error(`Baseline project ${chalk.bold(baseline.name)} needs to ${'workspace'} type project.`);
  //     }
  //     return baseline;
  //   }
  // }

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



}
//#endregion
