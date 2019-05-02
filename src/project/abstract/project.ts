//#region @backend
import chalk from 'chalk';
import * as fs from 'fs';
import * as fse from "fs-extra";
import * as path from 'path';
import * as _ from 'lodash';
import * as inquirer from 'inquirer';
import * as rimraf from 'rimraf';
export { ChildProcess } from 'child_process';
import { ChildProcess } from "child_process";

import config from '../../config';
import { RecreateFile, RunOptions, Package, BuildDir, EnvConfig, IPackageJSON, InstalationType, TnpNpmDependencyType } from '../../models';
import {
  error, info, warn, run as __run, watcher as __watcher, killProcessByPort,
  pullCurrentBranch, countCommits, lastCommitDate, lastCommitHash, currentBranchName, log, tryRemoveDir, HelpersLinks
} from '../../helpers';
import { NodeModules } from "../features/node-modules";
import { FilesRecreator } from '../features/files-recreator';
import { ProxyRouter } from '../features/proxy-router';
import { CopyManager } from '../features/copy-manager';
import { SourceModifier } from '../features/source-modifier';
import { TestRunner } from '../features/test-runner';
import { BuildOptions } from '../features/build-options';
import { NpmPackages } from '../features/npm-packages';
import { BaselineSiteJoin } from '../features/baseline-site-join';
import { TnpBundle } from '../features/tnp-bundle';
import { StaticBuild } from '../features/static-build';
import { FilesStructure } from '../features/files-structure';
import { AutoActions } from '../features/auto-actions';
import { BuildProcess } from '../features/build-proces';
import { FrameworkFilesGenerator } from '../features/framework-files-generator';
import { WorkspaceSymlinks } from '../features/workspace-symlinks';
import { TnpDB } from '../../tnp-db';
//#endregion

import { Morphi, ModelDataConfig } from 'morphi';
import { EnvironmentConfig } from '../features/environment-config';
import { PackageJSON } from '../features/package-json';
import { LibType, EnvironmentName, NpmDependencyType, IProject } from '../../models';



export abstract class BaseProject {

  abstract location: string;
  //#region @backend
  protected __defaultPort: number;
  //#endregion

  //#region @backend
  protected buildOptions?: BuildOptions;
  //#endregion
  modelDataConfig?: ModelDataConfig;
  id: number;

  public type: LibType;

  browser: IProject = {} as any;

  //#region @backend
  tests: TestRunner;
  //#endregion

  public packageJson: PackageJSON;

  //#region @backend
  public tnpBundle: TnpBundle;
  //#endregion

  //#region @backend
  public filesStructure: FilesStructure;
  //#endregion

  //#region @backend
  public buildProcess: BuildProcess;
  //#endregion

  //#region @backend
  public workspaceSymlinks: WorkspaceSymlinks;
  //#endregion

  //#region @backend
  public node_modules: NodeModules;
  //#endregion

  //#region @backend
  public recreate: FilesRecreator;
  //#endregion

  //#region @backend
  public join: BaselineSiteJoin;
  //#endregion

  //#region @backend
  public sourceModifier: SourceModifier;
  //#endregion

  //#region @backend
  public frameworkFileGenerator: FrameworkFilesGenerator;
  //#endregion

  //#region @backend
  public npmPackages: NpmPackages;
  //#endregion

  env: EnvironmentConfig;

  //#region @backend
  public proxyRouter: ProxyRouter;
  //#endregion

  //#region @backend
  public copyManager: CopyManager;
  //#endregion

  //#region @backend
  public staticBuild: StaticBuild;
  //#endregion

  //#region @backend
  public autoActions: AutoActions;
  //#endregion


  public get genericName(): string {
    if (Morphi.IsBrowser) {
      return this.browser.genericName;
    }
    //#region @backendFunc
    return [
      ((this.isWorkspaceChildProject && this.parent.isContainerChild) ? this.parent.parent.name : ''),
      (this.isWorkspaceChildProject ? this.parent.name : ''),
      (this.isContainerChild ? this.parent.name : ''),
      this.name
    ].filter(f => !!f).join('/').trim()
    //#endregion
  }


  public get name(): string {
    if (Morphi.IsBrowser) {
      return this.browser.name;
    }
    //#region @backendFunc
    return this.packageJson ? this.packageJson.name : path.basename(this.location);
    //#endregion
  }

  public get backupName() {
    if (Morphi.IsBrowser) {
      return this.browser.backupName;
    }
    //#region @backend
    return `tmp-${this.name}`
    //#endregion
  }

  //#region @backend
  get hasNpmOrganization() {
    // console.log('path.dirname(this.location)', path.dirname(this.location))
    return path.basename(path.dirname(this.location)).startsWith('@');
  }

  get npmOrganization() {
    if (!this.hasNpmOrganization) {
      return;
    }
    return path.basename(path.dirname(this.location))
  }
  //#endregion

  get isWorkspace() {
    if (Morphi.IsBrowser) {
      return this.browser.isWorkspace;
    }
    //#region @backend
    return this.type === 'workspace';
    //#endregion
  }

  get isContainer() {
    if (Morphi.IsBrowser) {
      return this.browser.isContainer;
    }
    //#region @backend
    return this.type === 'container';
    //#endregion
  }

  get isContainerChild() {
    if (Morphi.IsBrowser) {
      return this.browser.isContainerChild;
    }
    //#region @backend
    return !!this.parent && this.parent.type === 'container';
    //#endregion
  }



  get isBundleMode() {
    if (Morphi.IsBrowser) {
      return true;
    }
    //#region @backend
    return Project.isBundleMode;
    //#endregion
  }

  get parent(): Project {
    if (Morphi.IsBrowser) {
      return this.browser.parent;
    }
    //#region @backend
    return _.isString(this.location) && Project.From(path.join(this.location, '..'));
    //#endregion
  }
  get preview(): Project {
    if (Morphi.IsBrowser) {
      return this.browser.preview;
    }
    //#region @backend
    return _.isString(this.location) && Project.From(path.join(this.location, 'preview'));
    //#endregion
  }


  /**
   * Check if project is based on baseline ( in package json workspace )
   * (method works from any level)
   */
  get isBasedOnOtherProject() {
    if (Morphi.IsBrowser) {
      return this.browser.isBasedOnOtherProject;
    }
    //#region @backend
    if (this.isWorkspace) {
      return !!this.packageJson.pathToBaseline;
    } else if (this.isWorkspaceChildProject) {
      return this.parent && !!this.parent.packageJson.pathToBaseline;
    }
    //#endregion
  }


  /**
   * DONT USE WHEN IS NOT TO RESOLVE BASELINE PROJECT
   * USE isBasedOnOtherProject instead
   *
   * For site worksapce is baseline worksapace
   * For child site worksapce is baseline worksapce child
   */
  get baseline(): Project {
    if (Morphi.IsBrowser) {
      return this.browser.baseline;
    }
    //#region @backend
    if (this.isContainer) {
      error(`Baseline for container is not supported`)
    }
    if (this.isWorkspace) {
      return this.packageJson.pathToBaseline && Project.From(this.packageJson.pathToBaseline);
    } else if (this.isWorkspaceChildProject) {
      return this.parent && this.parent.baseline && Project.From(path.join(this.parent.baseline.location, this.name));
    }
    //#endregion
  }

  //#region @backend
  get StaticVersion() {
    const outDir: BuildDir = 'dist';
    if (this.isWorkspace) {
      return Project.From(path.join(this.location, outDir, this.name))
    } else if (this.isWorkspaceChildProject) {
      return Project.From(path.join(this.parent.location, outDir, this.parent.name, this.name))
    }
    error(`There is not static version for project ${this.genericName}`, false, true)
  }
  //#endregion

  get isBuildedLib() {
    if (Morphi.IsBrowser) {
      return this.browser.isBuildedLib;
    }
    //#region @backend
    if (this.type === 'angular-lib') {
      return fse.existsSync(path.join(this.location, config.folder.module)) &&
        fse.existsSync(path.join(this.location, config.folder.dist));
    }
    if (this.type === 'isomorphic-lib') {
      return fse.existsSync(path.join(this.location, config.folder.browser)) &&
        fse.existsSync(path.join(this.location, config.folder.dist));
    }
    //#endregion
  }

  get version() {
    if (Morphi.IsBrowser) {
      return this.browser.version;
    }
    //#region @backend
    return this.packageJson.version;
    //#endregion
  }

  get useFramework() {
    if (Morphi.IsBrowser) {
      return this.browser.useFramework;
    }
    //#region @backend
    if (!!this.baseline) {
      return this.baseline.packageJson.useFramework;
    }
    return this.packageJson.useFramework;
    //#endregion
  }

  //#region @backend
  get versionPatchedPlusOne() {

    if (!this.version) {

      if (!global[config.message.tnp_normal_mode]) {
        return
      }

      error(`Please define ${chalk.bold('version')} property in your package.json`, true)
      error(path.join(this.location, config.file.package_json), false, true)
    }
    const ver = this.version.split('.');
    if (ver.length > 0) {
      ver[ver.length - 1] = (parseInt(ver[ver.length - 1]) + 1).toString()
    }
    return ver.join('.')
  }
  //#endregion

  get resources(): string[] {
    if (Morphi.IsBrowser) {
      return this.browser.resources;
    }
    //#region @backend
    return this.packageJson.resources;
    //#endregion
  }

  get isSite() {
    if (Morphi.IsBrowser) {
      return this.browser.isSite;
    }
    //#region @backend
    const customExist = fs.existsSync(path.join(this.location, config.folder.custom));
    let basedOn = '';
    if (this.isWorkspace) {
      basedOn = this.packageJson.pathToBaseline;
    } else if (this.isWorkspaceChildProject) {
      basedOn = this.parent.packageJson.pathToBaseline;
    }

    // console.log('basedOn', basedOn)

    const res = (basedOn && basedOn !== '');
    // console.log(`Project '${this.location}' is site: ${res}`)
    return res;
    //#endregion
  }

  /**
   * Core project with basic tested functionality
   */
  get isCoreProject() {
    if (Morphi.IsBrowser) {
      return this.browser.isCoreProject;
    }
    //#region @backend
    return this.packageJson.isCoreProject;
    //#endregion
  }

  get isCommandLineToolOnly() {
    if (Morphi.IsBrowser) {
      return this.browser.isCommandLineToolOnly;
    }
    //#region @backend
    return this.packageJson.isCommandLineToolOnly;
    //#endregion
  }

  get labels() {
    const self = this;
    return {
      get generated() {
        return self.isGenerated ? '(generated)' : ''
      },
      //#region @backend
      get extendedBoldName() {
        return chalk.bold(`${self.labels.generated} ${self.parent ? (self.parent.name + '/') : ''}${self.name}`);
      }
      //#endregion
    }
  }

  get isGenerated() {
    if (Morphi.IsBrowser) {
      return this.browser.isGenerated;
    }
    //#region @backend
    return (this.isWorkspaceChildProject && this.parent.packageJson.isGenerated) ||
      (this.isWorkspace && this.packageJson.isGenerated)
    //#endregion
  }

  get isTnp() {
    if (Morphi.IsBrowser) {
      return this.browser.isTnp;
    }
    //#region @backend
    return this.name === 'tnp';
    //#endregion
  }

  get isCloud() {
    if (Morphi.IsBrowser) {
      return this.browser.isCloud;
    }
    //#region @backend
    return this.name === 'site' && this.type === 'workspace'; // TODO temporary solution
    //#endregion
  }

  get isWorkspaceChildProject() {
    if (Morphi.IsBrowser) {
      return this.browser.isWorkspaceChildProject;
    }
    //#region @backend
    return !!this.parent && this.parent.type === 'workspace';
    //#endregion
  }

  get allowedEnvironments() {
    if (Morphi.IsBrowser) {
      return this.browser.allowedEnvironments;
    }
    //#region @backend
    if (this.packageJson.data.tnp && _.isArray(this.packageJson.data.tnp.allowedEnv)) {
      return this.packageJson.data.tnp.allowedEnv.concat('local')
    }
    return config.allowedEnvironments.concat('local');
    //#endregion
  }

  /**
   * Standalone projects link: npm libs
   */
  get isStandaloneProject() {
    if (Morphi.IsBrowser) {
      return this.browser.isStandaloneProject;
    }
    //#region @backend
    return (!this.isWorkspaceChildProject && !this.isWorkspace && !this.isContainer && this.type !== 'unknow-npm-project');
    //#endregion
  }


  get customizableFilesAndFolders() {
    if (Morphi.IsBrowser) {
      return this.browser.customizableFilesAndFolders;
    }
    //#region @backend
    if (this.type === 'workspace') return [
      // 'environment.d.ts',
      'environment.js',
      'environment.dev.js',
      'environment.prod.js',
      'environment.stage.js',
      'environment.online.js'
    ]
    const files: string[] = ['src']
    if (this.type === 'angular-lib') files.push('components');
    return files;
    //#endregion
  }

  //#region @backend
  getFolders() {
    const notAllowed: RegExp[] = [
      '\.vscode', 'node\_modules',
      ..._.values(config.tempFolders),
      'e2e', 'tmp.*', 'dist.*', 'tests', 'module', 'browser', 'bundle*',
      'components', '\.git', 'bin', 'custom'
    ].map(s => new RegExp(s))

    const isDirectory = source => fse.lstatSync(source).isDirectory()
    const getDirectories = source =>
      fse.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)

    let subdirectories = getDirectories(this.location)
      .filter(f => {
        const folderNam = path.basename(f);
        return (notAllowed.filter(p => p.test(folderNam)).length === 0);
      })

    if (this.isTnp) {
      subdirectories = subdirectories.concat(getDirectories(path.join(this.location, config.folder.projects))
        .filter(f => {
          const folderNam = path.basename(f);
          return (notAllowed.filter(p => p.test(folderNam)).length === 0);
        }))
    }
    return subdirectories;
  }
  //#endregion


  //#region @backend
  getAllChildren(options?: { unknowIncluded: boolean; }) {
    const { unknowIncluded = false } = options || {};
    const subdirectories = this.getFolders();

    let res = subdirectories
      .map(dir => {
        // console.log('child:', dir)
        return Project.From(dir);
      })
      .filter(c => !!c)

    if (!unknowIncluded) {
      res = res.filter(c => c.type !== 'unknow-npm-project')
    }
    return res;
  }
  //#endregion

  get children(): Project[] {
    if (Morphi.IsBrowser) {
      return this.browser.children;
    }
    //#region @backend
    return this.getAllChildren()
    //#endregion
  }

  //#region @backend
  protected quickFixMissingLibs(missingLibsNames: string[] = []) {
    missingLibsNames.forEach(missingLibName => {
      const pathInProjectNodeModules = path.join(this.location, config.folder.node_modules, missingLibName)
      if (!fse.existsSync(pathInProjectNodeModules)) {
        fse.mkdirpSync(pathInProjectNodeModules);
        const indexjsLocation = path.join(pathInProjectNodeModules, 'index.js')
        fse.writeFileSync(indexjsLocation, ` export default { } `, 'utf8');
      }
    })
  }
  //#endregion

  //#region @backend
  protected startOnCommand(args: string): string {
    // should be abstract
    return undefined;
  }
  //#endregion

  //#region @backend
  protected async buildSteps(buildOptions?: BuildOptions) {
    // should be abstract
  }
  //#endregion

  //#region @backend
  linkTo(destPackageLocation: string) {
    HelpersLinks.createSymLink(this.location, destPackageLocation);
  }
  //#endregion


  //#region @backend
  public projectSpecyficFiles(): string[] {
    // should be abstract
    return []
  }
  //#endregion

  //#region @backend
  public projectSpecyficIgnoredFiles() {
    return [];
  }
  //#endregion

  public routerTargetHttp() {
    if (Morphi.IsBrowser) {
      return this.browser._routerTargetHttp;
    }
    //#region @backend
    return `http://localhost:${this.getDefaultPort()}`;
    //#endregion
  }

  //#region @backend
  public setDefaultPort(port: number) {
    this.__defaultPort = port;
  }
  //#endregion


  public getDefaultPort() {
    if (Morphi.IsBrowser) {
      return this.browser && this.browser.defaultPort;
    }
    //#region @backend
    return this.__defaultPort;
    //#endregion
  }



  //#region @backend
  public setDefaultPortByType() {
    this.setDefaultPort(Project.DefaultPortByType(this.type))
  }
  //#endregion


  //#region @backend
  public run(command: string, options?: RunOptions) {
    if (!options) { options = {}; }
    if (!options.cwd) { options.cwd = this.location; }
    return __run(command, options);
  }
  //#endregion

  //#region @backend
  public reset(showMsg = true) {
    if (showMsg) {
      log(`Reseting project: ${this.genericName}`);
    }
    const gitginoredfiles = this.recreate.filesIgnoredBy.gitignore
      .map(f => f.startsWith('/') ? f.substr(1) : f)
      .filter(f => {
        if (f === config.folder.node_modules) {
          return false;
        }
        if (config.filesNotAllowedToClen.includes(f)) {
          return false;
        }
        if (f.startsWith(config.folder.bundle) && this.isTnp) {
          return false;
        }
        return true;
      })

    for (let index = 0; index < gitginoredfiles.length; index++) {
      const fileOrDirPath = path.join(this.location, gitginoredfiles[index].trim());
      // log(`Removing: ${fileOrDirPath}`)
      rimraf.sync(fileOrDirPath)
    }
  }
  //#endregion

  //#region @backend
  public clear() {
    log(`Cleaning project: ${this.genericName}`);
    this.node_modules.remove();
    this.reset(false)
  }
  //#endregion

  //#region @backend
  public getDepsAsProject(type: NpmDependencyType | TnpNpmDependencyType, contextFolder?: string): Project[] {
    return this.getDepsAsPackage(type).map(packageObj => {
      if (type === 'tnp_required_workspace_child') {
        let p = path.resolve(path.join(this.location, '..', packageObj.name))
        if (this.isWorkspaceChildProject && fse.existsSync(p)) {
          const project = Project.From(p);
          return project;
        }
      }

      let p = path.join(contextFolder ? contextFolder : this.location, config.folder.node_modules, packageObj.name);
      if (fse.existsSync(p)) {
        const project = Project.From(p);
        return project;
      }
      // warn(`Dependency '${packageObj.name}' doen't exist in ${p}`)
    })
      .filter(f => !!f)
  }
  //#endregion

  //#region @backend
  public getDepsAsPackage(type: NpmDependencyType | TnpNpmDependencyType): Package[] {
    if (!this.packageJson.data) {
      return []
    }
    const isTnpOverridedDependency = (type === 'tnp_overrided_dependencies') &&
      this.packageJson.data.tnp &&
      this.packageJson.data.tnp.overrided &&
      this.packageJson.data.tnp.overrided.dependencies;

    const isTnpRequredWorkspaceChildren = (type === 'tnp_required_workspace_child') &&
      this.packageJson.data.tnp &&
      this.packageJson.data.tnp.required;

    let installType: InstalationType;

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
  public checkIfReadyForNpm() {

    // console.log('TYPEEEEE', this.type)
    const libs: LibType[] = ['angular-lib', 'isomorphic-lib'];
    if (!libs.includes(this.type)) {
      error(`This project '${chalk.bold(this.name)}' isn't library type project (${libs.join(', ')}).`)
    }
    return true;
  }
  //#endregion


  //#region @backend
  private async modifySourceBeforCompilation() {
    if (this.isSite) {
      await this.baseline.sourceModifier.init(`Initing source modifier for baseline`);
      await this.baseline.frameworkFileGenerator.init(`Initing baseline generated controllers/entites`);
      // await questionYesNo('Continue ?') // TODO fix this
    }

    if (config.allowedTypes.app.includes(this.type)) {
      if (!this.isStandaloneProject) {
        const sourceModifireName = `Client source modules pathes modifier`;
        const generatorName = 'Files generator: entites.ts, controllers.ts';
        if (this.buildOptions.watch) {
          if (this.type === 'isomorphic-lib' && this.useFramework) {
            await this.frameworkFileGenerator.initAndWatch(generatorName)
          } else {
            await this.sourceModifier.initAndWatch(sourceModifireName)
          }
        } else {
          if (this.type === 'isomorphic-lib' && this.useFramework) {
            await this.frameworkFileGenerator.init(generatorName)
          } else {
            await this.sourceModifier.init(sourceModifireName)
          }
        }
      }
    }
  }
  //#endregion

  //#region @backend
  private async selectAllProjectCopyto() {
    const db = await TnpDB.Instance;
    const projects = db
      .getProjects()
      .map(p => p.project)
      .filter(p => p.location !== this.location)

    this.buildOptions.copyto = projects;
  }

  private async selectProjectToCopyTO() {
    // clearConsole()
    const db = await TnpDB.Instance;
    const existedProject = db
      .getProjects()
      .map(p => p.project)
      .filter(p => p.location !== this.location)

    function getProjectName(p: Project) {
      return ((p.parent && p.parent.parent) ? `${p.parent.parent.name}/` : '') +
        (p.parent ? `${p.parent.name}/` : '') + p.name;
    }

    const { projects = [] }: { projects: string[] } = await inquirer
      .prompt([
        {
          type: 'checkbox',
          name: 'projects',
          message: 'Select projects where to copy bundle after finish: ',
          choices: existedProject
            .map(c => {
              return { value: c.location, name: getProjectName(c) }
            })
        }
      ]) as any;

    this.buildOptions.copyto = projects.map(p => Project.From(p))

    if (!_.isArray(this.buildOptions.copyto)) {
      this.buildOptions.copyto = []
    }

    // console.log(this.buildOptions)
    // process.exit(0)

    await db.transaction.updateCommandBuildOptions(this.location, this.buildOptions);
  }
  //#endregion

  //#region @backend
  async build(buildOptions?: BuildOptions) {
    // console.log('BUILD OPTIONS', buildOptions)

    if (this.isWorkspaceChildProject) {
      this.quickFixMissingLibs(['react-native-sqlite-storage'])
    }

    if (this.isCommandLineToolOnly) {
      buildOptions.onlyBackend = true;
    }


    this.buildOptions = buildOptions;

    await this.modifySourceBeforCompilation();

    let baseHref: string;
    // console.log('AM HERE')
    if (this.type === 'workspace') {
      baseHref = this.env.config.workspace.workspace.baseUrl;
    } else if (this.isWorkspaceChildProject) {
      baseHref = this.env.config &&
        this.env.config.workspace.projects.find(p => {
          return p.name === this.name
        }).baseUrl
    }

    // console.log(`basehref for current project `, baseHref)
    this.buildOptions.baseHref = baseHref;

    // TODO do this for isomorphic lib also
    // QUCIK_FIX for lazy programmers :P
    // IS IS NOT WOKRING BECOUSE morphi cwd typescript bug
    // if (this.isWorkspaceChildProject && this.type === 'angular-client') {
    //   const requiredLibs = this.parent.children
    //     .filter(c => (c.type === 'angular-lib') && !c.isBuildedLib)

    //   for (let i = 0; i < requiredLibs.length; i++) {
    //     const c = requiredLibs[i];
    //     await build(_.merge(_.cloneDeep(buildOptions), {
    //       watch: true,
    //       appBuild: false,
    //       compileOnce: true
    //     } as BuildOptions), undefined, c, false);
    //   }
    // }



    if (this.buildOptions.copytoAll) {
      await this.selectAllProjectCopyto()
    } else {
      if (!Array.isArray(this.buildOptions.copyto) || this.buildOptions.copyto.length === 0) {
        if (this.isStandaloneProject) {
          await this.selectProjectToCopyTO()
        }
      }
    }



    if (_.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0) {

      const unique = {};
      (this.buildOptions.copyto as Project[]).forEach(p => unique[p.location] = p);
      this.buildOptions.copyto = Object.keys(unique).map(location => unique[location]);

      (this.buildOptions.copyto as Project[]).forEach(proj => {
        const project = proj;
        const projectCurrent = this;
        const projectName = projectCurrent.isTnp ? config.file.tnpBundle : projectCurrent.name;
        const what = path.normalize(`${project.location}/node_module/${projectName}`)
        info(`After each build finish ${what} will be update.`)
      });
    }

    if (this.buildOptions.copytoAll || (_.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0)) {
      this.packageJson.show('show before build')
    }

    await this.buildSteps(buildOptions);
    await this.copyManager.initCopyingOnBuildFinish(buildOptions);
    if (buildOptions.compileOnce) {
      process.exit(0)
    }
  }
  //#endregion

  //#region @backend
  /**
   * Start server on top of static build
   * @param port
   */
  public async start(args?: string) {

    if (this.isWorkspace && !this.isGenerated) {

      const genLocationWOrkspace = path.join(this.location, config.folder.dist, this.name);
      const genWorkspace = Project.From(genLocationWOrkspace)
      if (!genWorkspace) {
        error(`No  ${'dist'}ributon folder. Please run: ${chalk.bold('tnp build')} in this workspace.
Generated workspace should be here: ${genLocationWOrkspace}
        `)
      }

      genWorkspace.run(`tnp start ${args}`).async()
      return;
    }


    await this.env.init(args, true)
    console.log(`Killing proces on port ${this.getDefaultPort()}`);
    killProcessByPort(this.getDefaultPort())
    console.log(`Project: ${this.name} is running on port ${this.getDefaultPort()}`);
    const command = this.startOnCommand(args);
    if (_.isString(command)) {
      const p = this.run(this.startOnCommand(args)).async()
      // p.on('exit', (ee) => {
      //   console.trace('exit !!!!', ee)
      // })
    }
  }
  //#endregion



  //#region @backend
  public requiredDependencies(): Package[] {
    return [
      { name: 'node-sass', version: '^4.7.2' },
      { name: 'typescript', version: '2.6.2' }
    ]
  }
  //#endregion

}








@Morphi.Entity<Project>({
  className: 'Project',
  classFamily: 'Project',
  classNameInBrowser: 'PROJECT',
  uniqueKeyProp: 'location',
  mapping: {
    packageJson: 'PackageJSON'
  },
  additionalMapping: {
    'browser.children': ['Project'],
    'browser.children.browser.childeren': ['Project'],
    'browser.children.browser.childeren.browser.childeren': ['Project'],
    'browser.parent': 'Project',
    'browser.parent.browser.parent': 'Project',
    'browser.baseline': 'Project',
    'browser.baseline.browser.baseline': 'Project',
    'browser.preview': 'Project',
    'browser.preview.browser.preview': 'Project',
  },
  //#region @backend
  createTable: false,
  browserTransformFn: (entity: Project, mdc: ModelDataConfig) => {
    // console.log('I AM TRANSFORMING ENTITY!!!', mdc)
    let exclude = [];
    if (!!mdc && mdc.exclude.length > 0) {
      exclude = mdc.exclude;
    }
    // if(exclude.length > 0) {
    //   console.log('exclude in Project', exclude)
    // }

    if (!(exclude.length > 0 && exclude.includes('children'))) {
      // console.log('SET CHILDREND')
      entity.browser.children = entity.children;
    } else {
      entity.browser.children = void 0
    }

    if (!(exclude.length > 0 && exclude.includes('parent'))) {
      entity.browser.parent = entity.parent;
    } else {
      entity.browser.parent = void 0
    }

    entity.browser.name = entity.name;
    entity.browser.isWorkspace = entity.isWorkspace
    entity.browser.isCloud = true;
    entity.browser.isStandaloneProject = entity.isStandaloneProject;

  }
  //#endregion
} as any)
export class Project extends BaseProject implements IProject {
  public static projects: Project[] = [];
  //#region @backend
  @Morphi.Orm.Column.Primary({ type: 'varchar', length: 400 })
  //#endregion
  public readonly location: string;

  //#region @backend
  private static typeFrom(location: string): LibType {
    const packageJson = PackageJSON.fromLocation(location);
    const type = packageJson.type;
    return type;
  }
  //#endregion

  //#region @backend
  public static From(location: string): Project {

    if (!_.isString(location)) {
      warn(`[project.from] location is not a string`)
      return;
    }
    location = path.resolve(location);

    const alreadyExist = Project.projects.find(l => l.location.trim() === location.trim());
    if (alreadyExist) {
      return alreadyExist;
    }
    if (!fs.existsSync(location)) {
      // warn(`[project.from] Cannot find project in location: ${location}`)
      return;
    }
    if (!PackageJSON.fromLocation(location)) {
      // warn(`[project.from] Cannot find package.json in location: ${location}`)
      return;
    };
    const type = this.typeFrom(location);

    let resultProject: Project;
    if (type === 'isomorphic-lib') {
      const { ProjectIsomorphicLib } = require('../project-isomorphic-lib');
      resultProject = new ProjectIsomorphicLib(location);
    }
    if (type === 'angular-lib') {
      const { ProjectAngularLib } = require('../project-angular-lib')
      resultProject = new ProjectAngularLib(location);
    }
    if (type === 'angular-client') {
      const { ProjectAngularClient } = require('../project-angular-client');
      resultProject = new ProjectAngularClient(location);
    }
    if (type === 'workspace') {
      const { ProjectWorkspace } = require('../project-workspace');
      resultProject = new ProjectWorkspace(location);
    }
    if (type === 'docker') {
      const { ProjectDocker } = require('../project-docker');
      resultProject = new ProjectDocker(location);
    }
    if (type === 'ionic-client') {
      const { ProjectIonicClient } = require('../project-ionic-client');
      resultProject = new ProjectIonicClient(location);
    }
    if (type === 'unknow-npm-project') {
      const { ProjectUnknowNpm } = require('../project-unknow-npm');
      resultProject = new ProjectUnknowNpm(location);
    }
    if (type === 'container') {
      const { ProjectContainer } = require('../project-container');
      resultProject = new ProjectContainer(location);
    }
    // console.log(resultProject ? (`PROJECT ${resultProject.type} in ${location}`)
    //     : ('NO PROJECT FROM LOCATION ' + location))

    // log(`[project.from] Result project: ${resultProject.name}`)
    return resultProject;
  }
  //#endregion

  //#region @backend
  public static nearestTo(location: string) {
    // console.log('nearestPorjectLocaiont', location)
    const project = this.From(location);
    if (project) {
      return project;
    }
    location = path.join(location, '..');
    if (!fs.existsSync(location)) {
      return void 0;
    }
    return this.From(path.resolve(location));
  }
  //#endregion


  public static DefaultPortByType(type: LibType): number {
    if (type === 'workspace') { return 5000; }
    if (type === 'angular-client') { return 4300; }
    if (type === 'angular-lib') { return 4250; }
    if (type === 'ionic-client') { return 8080; }
    if (type === 'docker') { return 5000; }
    if (type === 'isomorphic-lib') { return 4000; }
    if (type === 'container' || type === 'unknow-npm-project') {
      return;
    }
    // error(`[project] Cannot resove type for: ${type}`);
  }

  public static get isBundleMode() {
    if (Morphi.IsBrowser) {
      return true;
    }
    //#region @backend
    return !(!!global[config.message.tnp_normal_mode])
    //#endregion
  }


  //#region @backend
  static get Current() {

    const current = Project.From(process.cwd())
    if (!current) {
      error(`Current location is not a ${chalk.bold('tnp')} type project.\n\n${process.cwd()}`, false, true)
    }
    // console.log('CURRENT', current.location)
    return current;
  }
  //#endregion

  //#region @backend
  static get Tnp() {

    let tnp = Project.From(config.pathes.tnp_folder_location);
    if (tnp) {
      const currentPathInSystem = path.join(tnp.location, config.file.tnp_system_path_txt);
      if (!fse.existsSync(currentPathInSystem)) {
        fse.writeFileSync(currentPathInSystem, tnp.location, 'utf8')
      }
    } else {
      let tnpBundleTnpPath;
      if (global.tnp_normal_mode) {
        tnpBundleTnpPath = fse.readFileSync(config.pathes.tnp_system_path_txt).toString().trim()
      } else {
        tnpBundleTnpPath = fse.readFileSync(config.pathes.tnp_system_path_txt_tnp_bundle).toString().trim()
      }
      if (!fse.existsSync(tnpBundleTnpPath)) {
        error(`Please build you ${chalk.bold('tnp-npm-project')} first... `)
      }
      tnp = Project.From(tnpBundleTnpPath)
    }
    return tnp;
  }
  //#endregion

  //#region @backend
  public static by(libraryType: LibType): Project {

    if (libraryType === 'workspace') {
      const workspaceProject = Project.From(config.pathes.projectsExamples.workspace);
      return workspaceProject;
    }
    if (libraryType === 'container') {
      const workspaceProject = Project.From(config.pathes.projectsExamples.container);
      return workspaceProject;
    }

    const projectPath = path.join(config.pathes.projectsExamples.workspace, libraryType);
    if (!fse.existsSync(projectPath)) {
      error(`Bad library type: ${libraryType}`, true)
    }
    return Project.From(projectPath);
  }
  //#endregion

  //#region @backend
  constructor(location?: string) {
    super()

    if (!_.isUndefined(location)) {


      this.location = location;

      if (fs.existsSync(location)) {

        // console.log('PROJECT FROM', location)


        this.packageJson = PackageJSON.fromProject(this);
        this.staticBuild = new StaticBuild(this)
        this.workspaceSymlinks = new WorkspaceSymlinks(this);
        this.tnpBundle = new TnpBundle(this);
        this.node_modules = new NodeModules(this);
        this.type = this.packageJson.type;
        this.npmPackages = new NpmPackages(this)
        this.recreate = new FilesRecreator(this);
        this.sourceModifier = new SourceModifier(this);
        this.frameworkFileGenerator = new FrameworkFilesGenerator(this)
        this.autoActions = new AutoActions(this);
        if (!this.isStandaloneProject) {
          this.join = new BaselineSiteJoin(this);
        }
        this.tests = new TestRunner(this);

        Project.projects.push(this);

        // this.requiredLibs = this.packageJson.requiredProjects;


        this.__defaultPort = Project.DefaultPortByType(this.type);
        // console.log(`Default port by type ${this.name}, baseline ${this.baseline && this.baseline.name}`)
        if (!this.isStandaloneProject) {
          this.env = new EnvironmentConfig(this);
          this.proxyRouter = new ProxyRouter(this);
        }
        this.copyManager = new CopyManager(this);
        if (this.isStandaloneProject) {
          this.packageJson.updateHooks()
        }
        this.filesStructure = new FilesStructure(this);
        this.buildProcess = new BuildProcess(this);
      } else {
        warn(`Invalid project location: ${location}`);
      }
    }
  }
  //#endregion


  //#region @backend
  public get git() {
    const self = this;
    return {
      resetFiles(...relativePathes: string[]) {
        relativePathes.forEach(p => {
          try {
            self.run(`git checkout HEAD -- ${p}`, { cwd: self.location }).sync()
          } catch (err) {
            error(`[project.git] Not able to reset files: ${p} inside project ${self.name}.`
              , true, true)
          }
        })
      },
      get isGitRepo() {
        try {
          var test = self.run('git rev-parse --is-inside-work-tree',
            {
              cwd: self.location,
              output: false
            }).sync();
        } catch (e) {
        }
        return !!test;
      },
      async updateOrigin(askToRetry = false) {
        await pullCurrentBranch(self.location, askToRetry);
      },
      pushCurrentBranch() {
        self.run(`git push origin ${currentBranchName(self.location)}`).sync()
      },
      resetHard() {
        self.run(`git reset --hard`).sync()
      },

      countComits() {
        return countCommits(self.location);
      },

      lastCommitDate() {
        return lastCommitDate(self.location)
      },

      lastCommitHash() {
        return lastCommitHash(self.location)
      }
    }
  }
  //#endregion


}



