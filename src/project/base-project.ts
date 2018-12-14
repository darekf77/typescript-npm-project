import { LibType } from "../models";
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

import { EnvironmentConfig } from './environment-config';
import { ProxyRouter } from './proxy-router';

import { pullCurrentBranch, countCommits, lastCommitDate, lastCommitHash } from '../helpers-git';
import { CopyToManager } from './copyto-manager';
import { build } from '../scripts/BUILD';
import { SourceModifier } from './source-modifier';
import { ProjectsChecker } from '../single-instance';
//#endregion

export abstract class Project {

  public get name(): string {
    //#region @backendFunc
    return this.packageJson.name;
    //#endregion
  }

  public get backupName() {
    return `tmp-${this.name}`
  }

  get isWorkspace() {
    return this.type === 'workspace';
  }

  readonly type: LibType;

  public readonly location: string;

  //#region @backend
  abstract projectSpecyficFiles(): string[];
  public projectSpecyficIgnoredFiles() {
    return [];
  }
  abstract buildSteps(buildOptions?: BuildOptions);

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


  readonly packageJson: PackageJSON;
  readonly node_modules: NodeModules;
  readonly recreate: FilesRecreator;
  readonly join: BaselineSiteJoin;
  readonly sourceModifier: SourceModifier;
  readonly checker: ProjectsChecker;
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

  protected __defaultPort: number;

  public setDefaultPort(port: number) {
    this.__defaultPort = port;
  }

  public getDefaultPort() {
    return this.__defaultPort;
  }

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

  get labels() {
    const self = this;
    return {
      get generated() {
        return self.isGenerated ? '(generated)' : ''
      },
      get extendedBoldName() {
        return chalk.bold(`${self.labels.generated} ${self.parent ? (self.parent.name + '/') : ''}${self.name}`);
      }
    }
  }

  get isGenerated() {
    return (this.isWorkspaceChildProject && this.parent.packageJson.isGenerated) ||
      (this.isWorkspace && this.packageJson.isGenerated)
  }

  get isTnp() {
    return this.name === 'tnp';
  }

  get isCloud() {
    return this.name === 'site' && this.type === 'workspace'; // TODO temporary solution
  }

  get isWorkspaceChildProject() {
    return !!this.parent && this.parent.type === 'workspace';
  }



  get allowedEnvironments() {
    if (this.packageJson.data.tnp && _.isArray(this.packageJson.data.tnp.allowedEnv)) {
      return this.packageJson.data.tnp.allowedEnv.concat('local')
    }
    return config.allowedEnvironments.concat('local');
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

  protected buildOptions?: BuildOptions;
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

    this.buildSteps(buildOptions);
    this.copytToManager.initCopyingOnBuildFinish(buildOptions);
  }

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
    console.log(chalk.green(`${this.type.toUpperCase()} library structure created sucessfully...`));
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

  if (!project.checker.isReadyForTnpInstall()) {
    console.log(`Active projects in workspace on pids: ${project.checker.foundedActivePids(true).toString()} ,
    -  quit installing ${chalk.bold('tnp-bundle')}`)
    return
  }

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
      tryRemoveDir(destCompiledJs)
    }

    tryCopyFrom(`${pathTnpCompiledJS}/`, destCompiledJs, {
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

    const sourceTnpPath = path.join(Project.Tnp.location, config.file.tnp_system_path_txt);
    const destTnpPath = path.join(project.location, config.folder.node_modules,
      config.file.tnpBundle, config.file.tnp_system_path_txt)

    fse.copyFileSync(sourceTnpPath, destTnpPath);

    let lastTwo = _.first(pathTnpCompiledJS.match(/\/[a-zA-Z0-9\-\_]+\/[a-zA-Z0-9\-\_]+\/?$/));
    // console.info(`** tnp-bundle reinstalled from ${lastTwo}`)

    notNeededReinstallationTnp[project.location] = true;
    console.log(`Tnp-helper installed in ${project.name} from ${lastTwo} `)
  } else {
    // warn(`Standalone project "${project.name}" - ${chalk.bold('tnp')} is not goint be not installed.`)
  }
}
//#endregion
