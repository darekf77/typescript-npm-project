import { Morphi, ModelDataConfig } from 'morphi';

import { LibType, EnvironmentName, NpmDependencyType } from "../models";
import { PackageJSON } from "./features/package-json";
//#region @backend

import * as fs from 'fs';
import * as rimraf from 'rimraf';
import * as sleep from 'sleep';
import * as fse from "fs-extra";
import chalk from 'chalk';
import * as path from 'path';
import * as _ from 'lodash';
export { ChildProcess } from 'child_process';
import { ChildProcess } from "child_process";
// local
import { RecreateFile, RunOptions, Package, BuildDir, EnvConfig, IPackageJSON } from "../models";
import { error, info, warn } from "../helpers";
import config from "../config";
import { run as __run, watcher as __watcher, killProcessByPort, run, questionYesNo } from "../helpers";
import { copyFile, getMostRecentFilesNames, tryRemoveDir, tryCopyFrom } from "../helpers";
import { ProjectFrom, BaseProjectLib, BaselineSiteJoin } from './index';
import { NodeModules } from "./features/node-modules";
import { FilesRecreator } from './features/files-builder';

import { ProxyRouter } from './features/proxy-router';

import { pullCurrentBranch, countCommits, lastCommitDate, lastCommitHash, currentBranchName } from '../helpers';
import { CopyToManager } from './features/copyto-manager';
import { build } from '../scripts/BUILD';
import { SourceModifier } from './features/source-modifier';
import { reinstallTnp } from './features/tnp-bundle';
import { FrameworkFilesGenerator } from './features/framework-files-generator';
import { TnpDB } from '../tnp-db';
import * as inquirer from 'inquirer';
//#endregion

import { EnvironmentConfig } from './features/environment-config';
import { TestRunner } from './features/test-runner';
import { BuildOptions } from './features/build-options';



export interface IProject {
  isSite: boolean;
  isCoreProject: boolean;
  isBuildedLib: boolean;
  isCommandLineToolOnly: boolean;
  isGenerated: boolean;
  isWorkspaceChildProject: boolean;
  isBasedOnOtherProject: boolean;
  isWorkspace: boolean;
  isContainer: boolean;
  isContainerChild: boolean;
  isStandaloneProject: boolean;
  isTnp: boolean;
  isCloud: boolean;
  useFramework: boolean;
  name: string;
  defaultPort?: number;
  version: string;
  _routerTargetHttp?: string;
  customizableFilesAndFolders: string[];
  type: LibType;
  backupName: string;
  location: string;
  resources: string[];
  env: EnvironmentConfig;
  allowedEnvironments: EnvironmentName[];
  children: Project[];
  parent: Project;
  preview: Project;
  requiredLibs: Project[];
  baseline: Project;
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
export class Project implements IProject {
  modelDataConfig?: ModelDataConfig;
  id: number;
  static projects: Project[] = [];

  public static defaultPortByType(type: LibType): number {

    if (type === 'workspace') return 5000;
    if (type === 'angular-cli') return 4200;
    if (type === 'angular-client') return 4300;
    if (type === 'angular-lib') return 4250;
    if (type === 'ionic-client') return 8080;
    if (type === 'docker') return 5000;
    if (type === 'isomorphic-lib') return 4000;
    if (type === 'server-lib') return 4050;
  }

  readonly browser: IProject = {} as any;
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

  public static get isBundleMode() {
    if (Morphi.IsBrowser) {
      return true;
    }
    //#region @backend
    return !(!!global[config.message.tnp_normal_mode])
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

  readonly type: LibType;

  //#region @backend
  @Morphi.Orm.Column.Primary({ type: 'varchar', length: 400 })
  //#endregion
  public readonly location: string;


  //#region @backend
  projectSpecyficFiles(): string[] {
    // should be abstract
    return []
  }
  //#endregion


  //#region @backend
  public projectSpecyficIgnoredFiles() {
    return [];
  }
  //#endregion


  //#region @backend
  async buildSteps(buildOptions?: BuildOptions) {
    // should be abstract
  }
  //#endregion

  //#region @backend
  quickFixMissingLibs(missingLibsNames: string[] = []) {
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


  routerTargetHttp() {
    if (Morphi.IsBrowser) {
      return this.browser._routerTargetHttp;
    }
    //#region @backend
    return `http://localhost:${this.getDefaultPort()}`;
    //#endregion
  }


  //#region @backend
  tests: TestRunner;
  //#endregion

  readonly requiredLibs: Project[] = []; // TODO FIX THIS

  get parent(): Project {
    if (Morphi.IsBrowser) {
      return this.browser.parent;
    }
    //#region @backend
    return _.isString(this.location) && ProjectFrom(path.join(this.location, '..'));
    //#endregion
  }
  get preview(): Project {
    if (Morphi.IsBrowser) {
      return this.browser.preview;
    }
    //#region @backend
    return _.isString(this.location) && ProjectFrom(path.join(this.location, 'preview'));
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
    if (this.isWorkspace) {
      return this.packageJson.pathToBaseline && ProjectFrom(this.packageJson.pathToBaseline);
    } else if (this.isWorkspaceChildProject) {
      return this.parent && this.parent.baseline && ProjectFrom(path.join(this.parent.baseline.location, this.name));
    }
    //#endregion
  }


  readonly packageJson: PackageJSON;


  //#region @backend
  readonly node_modules: NodeModules;
  //#endregion

  //#region @backend
  readonly recreate: FilesRecreator;
  //#endregion

  //#region @backend
  readonly join: BaselineSiteJoin;
  //#endregion

  //#region @backend
  readonly sourceModifier: SourceModifier;
  //#endregion

  //#region @backend
  readonly frameworkFileGenerator: FrameworkFilesGenerator;
  //#endregion


  env: EnvironmentConfig;

  //#region @backend
  readonly proxyRouter: ProxyRouter;
  //#endregion

  //#region @backend
  readonly copytToManager: CopyToManager;
  //#endregion


  //#region @backend
  static get Current() {

    const current = ProjectFrom(process.cwd())
    if (!current) {
      error(`Current location is not a ${chalk.bold('tnp')} type project.\n\n${process.cwd()}`, false, true)
    }
    // console.log('CURRENT', current.location)
    return current;
  }
  //#endregion

  //#region @backend
  static get Tnp() {

    const filenameapth = 'tnp-system-path.txt';
    let tnp = ProjectFrom(path.join(__dirname, '..', '..'));
    if (tnp) {
      const currentPathInSystem = path.join(tnp.location, 'tnp-system-path.txt');
      if (!fse.existsSync(currentPathInSystem)) {
        fse.writeFileSync(currentPathInSystem, tnp.location, 'utf8')
      }
    } else {
      const savedTnpPath = path.join(__dirname, '..', filenameapth);
      const tnpBundleTnpPath = fse.readFileSync(savedTnpPath).toString().trim()
      if (!fse.existsSync(tnpBundleTnpPath)) {
        error(`Please build you ${chalk.bold('tnp-npm-project')} first... `)
      }
      tnp = ProjectFrom(tnpBundleTnpPath)
    }
    return tnp;
  }
  //#endregion

  //#region @backend
  protected __defaultPort: number;
  //#endregion

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



  public get isBuildedLib() {
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


  //#region @backend
  public setDefaultPortByType() {
    this.setDefaultPort(Project.defaultPortByType(this.type))
  }
  //#endregion


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
    // console.log(`Project "${this.location}" is site: ${res}`)
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
    return (!this.isWorkspaceChildProject && !this.isWorkspace && !this.isContainer);
    //#endregion
  }

  //#region @backend
  /**
   * Start server on top of static build
   * @param port
   */
  async start(args?: string) {

    if (this.isWorkspace && !this.isGenerated) {

      const genLocationWOrkspace = path.join(this.location, config.folder.dist, this.name);
      const genWorkspace = ProjectFrom(genLocationWOrkspace)
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
  protected startOnCommand(args: string): string {
    // should be abstract
    return undefined;
  }
  //#endregion

  //#region @backend
  requiredDependencies(): Package[] {
    return [
      { name: "node-sass", version: "^4.7.2" },
      { name: "typescript", version: "2.6.2" }
    ]
  }
  //#endregion



  //#region @backend
  constructor(location?: string) {

    if (!_.isUndefined(location)) {


      this.location = location;

      if (fs.existsSync(location)) {

        // console.log('PROJECT FROM', location)


        this.packageJson = PackageJSON.fromProject(this);
        this.node_modules = new NodeModules(this);
        this.type = this.packageJson.type;
        this.recreate = new FilesRecreator(this);
        this.sourceModifier = new SourceModifier(this, this.recreate);
        this.frameworkFileGenerator = new FrameworkFilesGenerator(this)
        if (!this.isStandaloneProject) {
          this.join = new BaselineSiteJoin(this);
        }
        this.tests = new TestRunner(this);

        Project.projects.push(this);

        // this.requiredLibs = this.packageJson.requiredProjects;


        this.__defaultPort = Project.defaultPortByType(this.type);
        // console.log(`Default port by type ${this.name}, baseline ${this.baseline && this.baseline.name}`)
        if (!this.isStandaloneProject) {
          this.env = new EnvironmentConfig(this);
          this.proxyRouter = new ProxyRouter(this);
        }
        this.copytToManager = new CopyToManager(this);
        if (this.isStandaloneProject) {
          this.packageJson.updateHooks()
        }

      } else {
        warn(`Invalid project location: ${location}`);
      }
    }
  }
  //#endregion


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
  run(command: string, options?: RunOptions) {
    if (!options) options = {}
    if (!options.cwd) options.cwd = this.location;
    return __run(command, options);
  }
  //#endregion

  //#region @backend
  protected get watcher() {
    const self = this;
    return {
      run(command: string, folderPath: string = 'src', wait?: number) {
        const cwd: string = self.location;
        return __watcher.run(command, folderPath, { cwd, wait });
      },
      call(fn: Function | string, params: string, folderPath: string = 'src') {
        const cwd: string = self.location;
        return __watcher.call(fn, params, folderPath, { cwd });
      }
    }
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
  protected buildOptions?: BuildOptions;
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
      this.packageJson.saveForInstall(true)
    }

    await this.buildSteps(buildOptions);
    await this.copytToManager.initCopyingOnBuildFinish(buildOptions);
    if (buildOptions.compileOnce) {
      process.exit(0)
    }
  }
  //#endregion


  //#region @backend

  async selectAllProjectCopyto() {
    const db = await TnpDB.Instance;
    const projects = db
      .getProjects()
      .map(p => p.project)
      .filter(p => p.location !== this.location)

    this.buildOptions.copyto = projects;
  }

  async selectProjectToCopyTO() {
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

    this.buildOptions.copyto = projects.map(p => ProjectFrom(p))

    if (!_.isArray(this.buildOptions.copyto)) {
      this.buildOptions.copyto = []
    }

    // console.log(this.buildOptions)
    // process.exit(0)

    await db.transaction.updateCommandBuildOptions(this.location, this.buildOptions);
  }
  //#endregion

  //#region @backend
  public get git() {
    const self = this;
    return {
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

  //#region @backend
  public clear(includeNodeModules = false, recrusive = false) {
    console.log(`Cleaning ${includeNodeModules ? '(node_modules folder included)' : ''} project: ${this.name}`);

    const gitginoredfiles = this.recreate.filesIgnoredBy.gitignore
      .map(f => f.startsWith('/') ? f.substr(1) : f)
      .filter(f => {
        if (f === config.folder.node_modules) {
          return includeNodeModules;
        }
        if (f.startsWith(config.folder.bundle) && this.isTnp) {
          return false;
        }
        return true;
      }) // link/unlink takes care of node_modules
      .join(' ')
    // console.log(`rimraf ${gitginoredfiles}`)

    const db = TnpDB.InstanceSync;
    // db.builds.killForClearOf(this)
    this.run(`rimraf ${gitginoredfiles}`).sync();
    if (recrusive) {
      if (this.isWorkspace && Array.isArray(this.children) && this.children.length > 0) {
        this.children.forEach(childProject => {
          childProject.clear(includeNodeModules)
        })
      }
    }

  }
  //#endregion

  //#region @backend
  public static by(libraryType: LibType): Project {

    // console.log('by libraryType ' + libraryType)
    let projectPath;
    if (libraryType === 'workspace') {
      let p = ProjectFrom(path.join(__dirname, `../../projects/container/workspace`));
      if (!p) {
        p = ProjectFrom(path.join(__dirname, `../projects/container/workspace`));
      }
      return p;
    }
    projectPath = path.join(__dirname, `../../projects/container/workspace/${libraryType}`);
    if (fse.existsSync(projectPath)) {
      return ProjectFrom(projectPath);
    }
    projectPath = path.join(__dirname, `../projects/container/workspace/${libraryType}`);
    if (!fs.existsSync(projectPath)) {
      error(`Bad library type: ${libraryType}`, true)
      return undefined;
    }
    return ProjectFrom(projectPath);
  }
  //#endregion


  //#region @backend
  getDeps(type: NpmDependencyType, contextFolder?: string) {
    if (this.packageJson.data && this.packageJson.data[type]) {
      const names = _.isArray(this.packageJson.data[type]) ? this.packageJson.data[type] : Object.keys(this.packageJson.data[type]);
      return names
        .map(packageName => {
          // console.log(packageName)
          // let p = path.resolve(path.join(this.location, '..', packageName))
          // if (this.isWorkspaceChildProject && fse.existsSync(p)) {
          //   const project = ProjectFrom(p);
          //   return project;
          // }
          let p = path.join(contextFolder ? contextFolder : this.location, config.folder.node_modules, packageName);
          if (fse.existsSync(p)) {
            const project = ProjectFrom(p);
            return project;
          }
          // warn(`Dependency "${packageName}" doen't exist in ${p}`)

        })
        .filter(f => !!f)
    }
    return [];
  }
  //#endregion

  get children(): Project[] {
    if (Morphi.IsBrowser) {
      return this.browser.children;
    }
    //#region @backend
    // console.log('from ' + this.location)

    const notAllowed: RegExp[] = [
      '\.vscode', 'node\_modules',
      ..._.values(config.folder),
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

    return subdirectories
      .map(dir => {
        // console.log('child:', dir)
        return ProjectFrom(dir);
      })
      .filter(c => !!c)
    //#endregion
  }

  //#region @backend
  cloneTo(destinationPath: string): Project {
    const options: fse.CopyOptionsSync = {
      overwrite: true,
      recursive: true,
      errorOnExist: true,
      filter: (src) => {
        return !/.*node_modules.*/g.test(src);
      }
    };
    fse.copySync(this.location, destinationPath, options);
    info(`${this.type.toUpperCase()} library structure created sucessfully...`);
    const project = ProjectFrom(destinationPath);
    info('Done.');
    return project;
  }
  //#endregion

  //#region @backend
  public checkIfReadyForNpm() {

    // console.log('TYPEEEEE', this.type)
    const libs: LibType[] = ['angular-lib', 'isomorphic-lib'];
    if (!libs.includes(this.type)) {
      error(`This project "${chalk.bold(this.name)}" isn't library type project (${libs.join(', ')}).`)
    }
    return true;
  }
  //#endregion

  //#region @backend
  reinstallCounter = 1;
  //#endregion


  //#region @backend
  public get tnpHelper() {

    if (!Project.Tnp) {
      // console.log(Project.Current.location)
      // console.log('dirname', __dirname)
      return {
        install() {
          // console.log('install tnp from recreate', installFromRecreate)
          // console.log('TRACE BELOW IT IS NOT ERROR... JUST TRACING...')
          console.trace(`** ERR Project.Tnp not available yet`)
        }

      } // TODO QUCIK FIX for tnp installd in node_modules
    }

    let pathTnpCompiledJS = path.join(Project.Tnp.location, config.folder.dist);
    if (!fse.existsSync(pathTnpCompiledJS)) {
      pathTnpCompiledJS = path.join(Project.Tnp.location, config.folder.bundle);
    }
    const pathTnpPackageJSONData: IPackageJSON = fse.readJsonSync(path.join(Project.Tnp.location, config.file.package_json)) as any;

    pathTnpPackageJSONData.name = config.file.tnpBundle;
    pathTnpPackageJSONData.tnp = undefined;
    pathTnpPackageJSONData.bin = undefined;
    pathTnpPackageJSONData.main = undefined;
    pathTnpPackageJSONData.preferGlobal = undefined;
    pathTnpPackageJSONData.dependencies = undefined;
    pathTnpPackageJSONData.devDependencies = undefined;


    const self = this;
    return {
      install() { // install
        // console.log('install tnp from recreate', installFromRecreate)

        let project = self;

        if (process.platform === 'win32') {
          try {
            reinstallTnp(project, pathTnpCompiledJS, pathTnpPackageJSONData)
          } catch (e) {
            console.log(`Trying to reinstall tnp in ${project && project.name}... ${self.reinstallCounter++} `)
            console.log(e)
            sleep.sleep(2);
            self.tnpHelper.install()
          }
        } else {
          reinstallTnp(project, pathTnpCompiledJS, pathTnpPackageJSONData)
        }
      }
    }

  }
  //#endregion



}
