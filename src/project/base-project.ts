import { Morphi } from 'morphi';

import { LibType, EnvironmentName } from "../models";
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
import { PackageJSON } from "./package-json";
import { BuildOptions, RecreateFile, RunOptions, Package, BuildDir, EnvConfig, IPackageJSON } from "../models";
import { error, info, warn } from "../messages";
import config from "../config";
import { run as __run, watcher as __watcher, killProcessByPort, run } from "../process";
import { copyFile, getMostRecentFilesNames, tryRemoveDir, tryCopyFrom } from "../helpers";
import { ProjectFrom, BaseProjectLib, BaselineSiteJoin } from './index';
import { NodeModules } from "./node-modules";
import { FilesRecreator } from './files-builder';

import { ProxyRouter } from './proxy-router';

import { pullCurrentBranch, countCommits, lastCommitDate, lastCommitHash } from '../helpers-git';
import { CopyToManager } from './copyto-manager';
import { build } from '../scripts/BUILD';
import { SourceModifier } from './source-modifier';
import { ProjectsChecker } from '../single-instance';
import { reinstallTnp } from './tnp-bundle';
import { isNode } from 'ng2-logger';
//#endregion

import { EnvironmentConfig } from './environment-config';

export interface IProject {
  isSite: boolean;
  isCoreProject: boolean;
  isGenerated: boolean;
  isWorkspaceChildProject: boolean;
  isWorkspace: boolean;
  isStandaloneProject: boolean;
  isTnp: boolean;
  isCloud: boolean;
  name: string;
  defaultPort?: number;
  version: string;
  getDefaultPort(): number;
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

@Morphi.Entity({
  className: 'Project'
})
export class Project implements IProject {
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

  readonly browser: IProject;
  public get name(): string {
    //#region @backendFunc
    if (isNode) {
      return this.packageJson.name;
    }
    //#endregion
  }

  public get backupName() {
    return `tmp-${this.name}`
  }

  get isWorkspace() {
    return this.type === 'workspace';
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

  //#region @backend
  routerTargetHttp() {
    return `http://localhost:${this.getDefaultPort()}`;
  }
  //#endregion


  readonly requiredLibs: Project[] = []; // TODO FIX THIS

  get parent(): Project {
    if (Morphi.IsBrowser) {
      return this.browser.parent;
    }
    //#region @backend
    return ProjectFrom(path.join(this.location, '..'));
    //#endregion
  }
  get preview(): Project {
    if (Morphi.IsBrowser) {
      return this.browser.preview;
    }
    //#region @backend
    return ProjectFrom(path.join(this.location, 'preview'));
    //#endregion
  }

  //#region @backend
  /**
   * Check if project is based on baseline ( in package json workspace )
   * (method works from any level)
   */
  get isBasedOnOtherProject() {
    if (this.isWorkspace) {
      return !!this.packageJson.pathToBaseline;
    } else if (this.isWorkspaceChildProject) {
      return this.parent && !!this.parent.packageJson.pathToBaseline;
    }
  }
  //#endregion

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

  //#region @backend
  readonly packageJson: PackageJSON;
  //#endregion

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
  readonly checker: ProjectsChecker;
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
      error(`Current location is not a ${chalk.bold('tnp')} type project.\n\n${process.cwd()}`)
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
      return this.browser.defaultPort;
    }
    //#region @backend
    return this.__defaultPort;
    //#endregion
  }


  //#region @backend
  public get isBuildedLib() {

    if (this.type === 'angular-lib') {
      return fse.existsSync(path.join(this.location, config.folder.module)) &&
        fse.existsSync(path.join(this.location, config.folder.dist));
    }
    if (this.type === 'isomorphic-lib') {
      return fse.existsSync(path.join(this.location, config.folder.browser)) &&
        fse.existsSync(path.join(this.location, config.folder.dist));
    }
  }
  //#endregion


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

  //#region @backend
  get versionPatchedPlusOne() {
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
    return !this.isWorkspaceChildProject && !this.isWorkspace;
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
  constructor(location: string) {
    if (!_.isUndefined(location)) {


      this.location = location;

      if (fs.existsSync(location)) {

        // console.log('PROJECT FROM', location)


        this.packageJson = PackageJSON.fromProject(this);
        this.node_modules = new NodeModules(this);
        this.type = this.packageJson.type;
        this.recreate = new FilesRecreator(this);
        this.sourceModifier = new SourceModifier(this, this.recreate);
        if (!this.isStandaloneProject) {
          this.join = new BaselineSiteJoin(this);
        }
        this.checker = new ProjectsChecker(this);

        Project.projects.push(this);

        // this.requiredLibs = this.packageJson.requiredProjects;


        this.__defaultPort = Project.defaultPortByType(this.type);
        // console.log(`Default port by type ${this.name}, baseline ${this.baseline && this.baseline.name}`)
        if (!this.isStandaloneProject) {
          this.env = new EnvironmentConfig(this);
          this.proxyRouter = new ProxyRouter(this);
        }
        this.copytToManager = new CopyToManager(this);

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
  private modifySourceBeforCompilation() {
    if (config.allowedTypes.app.includes(this.type)) {
      if (!this.isStandaloneProject) {
        this.sourceModifier.init(`client source modifier`)
        // if (this.buildOptions.watch) {
        //   this.sourceModifier.initAndWatch()
        // } else {
        //   this.sourceModifier.init()
        // }
      }
    }
  }
  //#endregion

  //#region @backend
  protected buildOptions?: BuildOptions;
  //#endregion

  //#region @backend
  async build(buildOptions?: BuildOptions) {

    if (this.isWorkspaceChildProject) {
      this.quickFixMissingLibs(['react-native-sqlite-storage'])
    }


    this.buildOptions = buildOptions;

    this.modifySourceBeforCompilation();

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

    await this.buildSteps(buildOptions);
    this.copytToManager.initCopyingOnBuildFinish(buildOptions);
  }
  //#endregion

  //#region @backend
  public get git() {
    const self = this;
    return {
      async updateOrigin(askToRetry = false) {
        await pullCurrentBranch(self.location, askToRetry);
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
    this.checker.killAndClear()
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
      let p = ProjectFrom(path.join(__dirname, `../../projects/workspace`));
      if (!p) {
        p = ProjectFrom(path.join(__dirname, `../projects/workspace`));
      }
      return p;
    }
    projectPath = path.join(__dirname, `../../projects/workspace/${libraryType}`);
    if (fse.existsSync(projectPath)) {
      return ProjectFrom(projectPath);
    }
    projectPath = path.join(__dirname, `../projects/workspace/${libraryType}`);
    if (!fs.existsSync(projectPath)) {
      error(`Bad library type: ${libraryType}`, true)
      return undefined;
    }
    return ProjectFrom(projectPath);
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
    console.log(chalk.green(`${this.type.toUpperCase()} library structure created sucessfully...`));
    const project = ProjectFrom(destinationPath);
    console.log(chalk.green('Done.'));
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
        install(installFromRecreate = false) {
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
      install(installFromRecreate = false) { // install
        // console.log('install tnp from recreate', installFromRecreate)
        const client = self;
        let project: Project;
        if (self.parent && self.parent.type === 'workspace') {
          project = self.parent;
        } else {
          project = self;
        }

        if (process.platform === 'win32') {
          try {
            reinstallTnp(project, pathTnpCompiledJS, pathTnpPackageJSONData, client)
          } catch (e) {
            console.log(`Trying to reinstall tnp in ${project && project.name}... ${self.reinstallCounter++} `)
            console.log(e)
            sleep.sleep(2);
            self.tnpHelper.install()
          }
        } else {
          reinstallTnp(project, pathTnpCompiledJS, pathTnpPackageJSONData, client)
        }
      }
    }

  }
  //#endregion



}
