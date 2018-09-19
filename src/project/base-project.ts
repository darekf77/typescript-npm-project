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
import { LibType, BuildOptions, RecreateFile, RunOptions, Package, BuildDir, EnvConfig, IPackageJSON } from "../models";
import { error, info, warn } from "../messages";
import config from "../config";
import { run as __run, watcher as __watcher, killProcessByPort, run } from "../process";
import { copyFile, getMostRecentFilesNames } from "../helpers";
import { ProjectFrom, BaseProjectLib, BaselineSiteJoin } from './index';
import { NodeModules } from "./node-modules";
import { FilesRecreator } from './files-builder';

import { EnvironmentConfig } from './environment-config';
import { ProxyRouter } from './proxy-router';

import { pullCurrentBranch } from '../helpers-git';
import { CopyToManager } from './copyto-manager';
//#endregion

export abstract class Project {

  public get name(): string {
    //#region @backendFunc
    return this.packageJson.name;
    //#endregion
  }

  public readonly location: string;

  //#region @backend
  abstract projectSpecyficFiles(): string[];
  public projectSpecyficIgnoredFiles() {
    return [];
  }
  abstract buildSteps(buildOptions?: BuildOptions);

  routerTargetHttp() {
    return `http://localhost:${this.getDefaultPort()}`;
  }


  readonly requiredLibs: Project[] = []; // TODO FIX THIS
  get parent(): Project {
    return ProjectFrom(path.join(this.location, '..'));
  }
  get preview(): Project {
    return ProjectFrom(path.join(this.location, 'preview'));
  }

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

  /**
   * DONT USE WHEN IS NOT TO RESOLVE BASELINE PROJECT
   * USE isBasedOnOtherProject instead
   *
   * For site worksapce is baseline worksapace
   * For child site worksapce is baseline worksapce child
   */
  get baseline(): Project {

    if (this.isWorkspace) {
      return this.packageJson.pathToBaseline && ProjectFrom(this.packageJson.pathToBaseline);
    } else if (this.isWorkspaceChildProject) {
      return this.parent && this.parent.baseline && ProjectFrom(path.join(this.parent.baseline.location, this.name));
    }
  }

  readonly type: LibType;
  readonly packageJson: PackageJSON;
  readonly node_modules: NodeModules;
  readonly recreate: FilesRecreator;
  readonly join: BaselineSiteJoin;
  env: EnvironmentConfig;
  readonly proxyRouter: ProxyRouter;
  readonly copytToManager: CopyToManager;

  static projects: Project[] = [];

  static get Current() {
    const current = ProjectFrom(process.cwd())
    if (!current) {
      error(`Current location is not a ${chalk.bold('tnp')} type project.\n\n${process.cwd()}`)
    }
    // console.log('CURRENT', current.location)
    return current;
  }
  static get Tnp() {
    return ProjectFrom(path.join(__dirname, '..', '..'));
  }

  protected __defaultPort: number;

  public setDefaultPort(port: number) {
    this.__defaultPort = port;
  }

  public getDefaultPort() {
    return this.__defaultPort;
  }

  public setDefaultPortByType() {
    this.setDefaultPort(Project.defaultPortByType(this.type))
  }

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

  

  get version() {
    return this.packageJson.version;
  }

  get versionPatchedPlusOne() {
    const ver = this.version.split('.');
    if (ver.length > 0) {
      ver[ver.length - 1] = (parseInt(ver[ver.length - 1]) + 1).toString()
    }
    return ver.join('.')
  }

  get resources(): string[] {
    return this.packageJson.resources;
  }

  get isSite() {
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
  }

  /**
   * Core project with basic tested functionality
   */
  get isCoreProject() {
    return this.packageJson.isCoreProject;
  }

  get isTnp() {
    return this.name === 'tnp';
  }

  get isWorkspaceChildProject() {
    return this.parent && this.parent.type === 'workspace';
  }

  get isWorkspace() {
    return this.type === 'workspace';
  }

  /**
   * Standalone projects link: npm libs
   */
  get isStandaloneProject() {
    return !this.isWorkspaceChildProject && !this.isWorkspace;
  }

  /**
   * Start server on top of static build
   * @param port
   */
  async start(args?: string) {
    await this.env.init(args)
    console.log(`Project: ${this.name} is running on port ${this.getDefaultPort()}`);
    killProcessByPort(this.getDefaultPort())

    this.run(this.startOnCommand(args)).async()
  }

  protected abstract startOnCommand(args: string): string;

  requiredDependencies(): Package[] {
    return [
      { name: "node-sass", version: "^4.7.2" },
      { name: "typescript", version: "2.6.2" }
    ]
  }



  constructor(location: string) {
    this.location = location;

    if (fs.existsSync(location)) {

      // console.log('PROJECT FROM', location)

      this.packageJson = PackageJSON.from(location);
      this.node_modules = new NodeModules(this);
      this.type = this.packageJson.type;
      this.recreate = new FilesRecreator(this);
      if (!this.isStandaloneProject) {
        this.join = new BaselineSiteJoin(this);
      }

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
      error(`Invalid project location: ${location}`);
    }
  }


  get customizableFilesAndFolders() {
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
  }


  run(command: string, options?: RunOptions) {
    if (!options) options = {}
    if (!options.cwd) options.cwd = this.location;
    return __run(command, options);
  }

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



  protected buildOptions?: BuildOptions;
  async build(buildOptions?: BuildOptions) {

    const { prod, watch, outDir } = buildOptions;

    this.buildOptions = buildOptions;

    if (this.isWorkspaceChildProject) {
      this.parent.tnpHelper.install()
    } else if (this.isWorkspace) {
      this.tnpHelper.install()
    }

    // console.log(`Prepare environment for: ${this.name}`)
    if (!this.isStandaloneProject) {
      await this.env.init(buildOptions);
    }


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

    this.buildSteps(buildOptions);
  }

  public get git() {
    const self = this;
    return {
      updateOrigin() {
        pullCurrentBranch(self.location);
      }
    }
  }

  public clear(includeNodeModules = false) {
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
    this.run(`rimraf ${gitginoredfiles}`).sync();
    if (this.isWorkspace && Array.isArray(this.children) && this.children.length > 0) {
      this.children.forEach(childProject => {
        childProject.clear(includeNodeModules)
      })
    }
  }

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


  get children(): Project[] {

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

    return subdirectories
      .map(dir => {
        // console.log('child:', dir)
        return ProjectFrom(dir);
      })
      .filter(c => !!c)
  }

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
    console.log(chalk.green(`${this.type.toUpperCase()} library structure created sucessfully, installing npm...`));
    const project = ProjectFrom(destinationPath);
    console.log(chalk.green('Done.'));
    return project;
  }

  public checkIfReadyForNpm() {
    // console.log('TYPEEEEE', this.type)
    const libs: LibType[] = ['angular-lib', 'isomorphic-lib'];
    if (!libs.includes(this.type)) {
      error(`This project "${chalk.bold(this.name)}" isn't library type project (${libs.join(', ')}).`)
    }
    return true;
  }

  reinstallCounter = 1;

  public get tnpHelper() {

    if (!Project.Tnp) {
      // console.log(Project.Current.location)
      // console.log('dirname', __dirname)
      return {
        install(installFromRecreate = false) {
          console.log('install tnp from recreate', installFromRecreate)
          console.log('TRACE BELOW IT IS NOT ERROR... JUST TRACING...')
          // console.trace(`** ERR Project.Tnp not available yet`)
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


    const self = this;
    return {
      install(installFromRecreate = false) { // install
        console.log('install tnp from recreate', installFromRecreate)
        let project: Project;
        if (self.parent && self.parent.type === 'workspace') {
          project = self.parent;
        } else {
          project = self;
        }

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
    //#endregion
  }


  //#region @backend

  // TODO solve problem with ngc watch mode high cpu
  // get ownNpmPackage() {
  //     const self = this;
  //     return {
  //         linkTo(project: Project) {
  //             const targetLocation = path.join(project.location, 'node_modules', self.name)
  //             // project.run(`rimraf ${targetLocation}`).sync();
  //             Project.Tnp.run(`tnp ln ./ ${targetLocation}`).sync()
  //         },
  //         unlinkFrom(project: Project) {
  //             const targetLocation = path.join(project.location, 'node_modules', self.name)
  //             project.run(`rimraf ${targetLocation}`).sync();
  //         }
  //     };
  // }

};

function checkIfFileTnpFilesUpToDateInDest(destination: string): boolean {
  const tnpDistCompiled = path.join(Project.Tnp.location, config.folder.dist)

  return getMostRecentFilesNames(tnpDistCompiled)
    .map(f => f.replace(tnpDistCompiled, ''))
    .filter(f => {
      const fileInDest = path.join(destination, f)
      const fileInTnp = path.join(tnpDistCompiled, f);

      if (!fs.existsSync(fileInDest)) {
        // console.log(`File ${fileInDest} doesn't exist`)
        return true;
      }

      const res = fs.readFileSync(fileInTnp).toString().trim() !== fs.readFileSync(fileInDest).toString().trim()
      // console.log(`
      //   compare: "${fileInDest}" ${fs.readFileSync(fileInDest).toString().length}
      //   with : "${fileInTnp}" ${fs.readFileSync(fileInTnp).toString().length}
      //   result: ${res}
      // `)
      return res;
    }).length === 0;
}

const notNeededReinstallationTnp = {};

function reinstallTnp(project: Project, pathTnpCompiledJS: string, pathTnpPackageJSONData: IPackageJSON) {
  if (project.isTnp) {
    return
  }

  if (notNeededReinstallationTnp[project.location]) {
    return;
  }
  if (project.isWorkspaceChildProject || project.type === 'workspace') {


    const destCompiledJs = path.join(project.location, config.folder.node_modules, config.file.tnpBundle)

    if (process.platform === 'win32' && checkIfFileTnpFilesUpToDateInDest(destCompiledJs)) {
      notNeededReinstallationTnp[project.location] = true;
      // console.log(`Reinstallation of "tnp" not needed in ${project.name} `);
      return;
    }

    const destPackageJSON = path.join(project.location, config.folder.node_modules, config.file.tnpBundle, config.file.package_json)

    if (fs.existsSync(destCompiledJs)) {
      // console.log(`Removed tnp - helper from ${ dest } `)
      rimraf.sync(destCompiledJs)
    }
    fse.copySync(`${pathTnpCompiledJS}/`, destCompiledJs, {
      filter: (src: string, dest: string) => {
        return !src.endsWith('/dist/bin') &&
          !src.endsWith('/bin') &&
          !/.*node_modules.*/g.test(src);
      }
    });
    fse.writeJsonSync(destPackageJSON, pathTnpPackageJSONData, {
      encoding: 'utf8',
      spaces: 2
    })
    let lastTwo = _.first(pathTnpCompiledJS.match(/\/[a-zA-Z0-9\-\_]+\/[a-zA-Z0-9\-\_]+\/?$/));
    // console.info(`** tnp-bundle reinstalled from ${lastTwo}`)

    notNeededReinstallationTnp[project.location] = true;
    console.log(`Tnp-helper installed in ${project.name} from ${lastTwo} `)
  } else {
    // warn(`Standalone project "${project.name}" - ${chalk.bold('tnp')} is not goint be not installed.`)
  }
}
//#endregion
