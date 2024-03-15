//#region imports
import { config, ConfigModels, extAllowedToReplace, TAGS } from 'tnp-config/src';
import { Models } from 'tnp-models/src';
import { _, crossPlatformPath } from 'tnp-core/src';
import { Helpers, BaseProjectResolver, BaseProject } from 'tnp-helpers/src';
import * as inquirer from 'inquirer';
import { BuildOptions } from 'tnp-db/src';
import { CLASS } from 'typescript-class-helpers/src';
import { LibTypeArr } from 'tnp-config';
import { RunOptions, ExecuteOptions } from 'tnp-core';
//#region @backend
import { fse } from 'tnp-core/src';
import { path } from 'tnp-core/src';
import { BaseFiredevProject } from './base-project';
import { NpmProject } from './npm-project';
import { FeatureProject } from './feature-project';
import { FiredevProject } from './firedev-project';
import { FolderProject } from './folder-project';
import { LibProject } from './lib-project.backend';
import { VscodeProject } from './vscode-project.backend';
import { RecreatableProject } from './recreatable-project.backend';
import { EntityProject } from './entity-projects.backend';
import { BuildableProject } from './buildable-project.backend';
import { ElectronProject } from './electron-project.backend';
import {
  PackageJSON, QuickFixes,
  NpmPackages, NodeModules, FilesRecreator, FilesFactory,
  FilesTemplatesBuilder,
  MochaTestRunner, JestTestRunner, CypressTestRunner,
  EnvironmentConfig,
  FilesStructure, BuildProcessFeature, TargetProject,
  GitActions,
  WebpackBackendCompilation,
  LinkedRepos,
  Branding,
  DocsAppBuildConfig,
  AssetsManager,
} from '../../features';
import { AssetsFileListGenerator } from '../../compilers';
import { CopyManager } from '../../features/copy-manager';
import { DependencyProject } from './dependency-project.backend';
import { CompilerCache } from '../../features/compiler-cache.backend';
import { SmartNodeModules } from '../../features/smart-node-modules.backend';
import { InsideStructures } from '../../features/inside-structures/inside-structures';
import { SingularBuild } from '../../features/singular-build.backend';
import { argsToClear, DEFAULT_PORT, PortUtils } from '../../../constants';
import { RegionRemover } from 'isomorphic-region-loader/src';
import { IncrementalBuildProcess } from '../../../project/compilers/build-isomorphic-lib/compilations/incremental-build-process.backend';
import { PackagesRecognition } from '../../../project/features/package-recognition/packages-recognition';
import { CLI } from 'tnp-cli/src';
import { glob } from 'tnp-core/src';
//#endregion

//#endregion

//#region FIREDEF PROJECT RESOLVE
export class FiredevProjectResolve extends BaseProjectResolver<Project> {

  //#region methods / type from
  typeFrom(location: string) {
    //#region @backendFunc
    const PackageJSON = CLASS.getBy('PackageJSON') as any;
    location = crossPlatformPath(location);
    if (!fse.existsSync(location)) {
      return void 0;
    }
    const packageJson = PackageJSON && PackageJSON.fromLocation(location);
    if (!_.isObject(packageJson)) {
      return void 0;
    }
    const type = packageJson.type;
    return type;
    //#endregion
  }
  //#endregion

  //#region methods / from
  /**
   * TODO use base resolve
   */
  From(locationOfProj: string | string[], options?: any): Project {
    //#region @backendFunc
    if (Array.isArray(locationOfProj)) {
      locationOfProj = locationOfProj.join('/');
    }
    let location = locationOfProj.replace(/\/\//g, '/');

    if (!_.isString(location)) {
      Helpers.warn(`[project.from] location is not a string`)
      return;
    }
    if (path.basename(location) === 'dist') {
      location = path.dirname(location);
    }
    location = crossPlatformPath(path.resolve(location));
    if (this.emptyLocations.includes(location)) {
      if (location.search(`/${config.folder.dist}`) === -1) {
        Helpers.log(`[project.from] empty location ${location}`, 2)
        return;
      }
    }

    const alreadyExist = this.projects.find(l => l.location.trim() === location.trim());
    if (alreadyExist) {
      return alreadyExist as any;
    }
    if (!fse.existsSync(location)) {
      Helpers.log(`[firedev-helpers][project.from] Cannot find project in location: ${location}`, 1);
      this.emptyLocations.push(location);
      return;
    }
    let type = this.typeFrom(location);

    let resultProject: Project;
    if (type === 'isomorphic-lib') {
      resultProject = new ProjectIsomorphicLib(location);
    }
    if (type === 'vscode-ext') {
      resultProject = new ProjectVscodeExt(location);
    }
    if (type === 'container') {
      resultProject = new ProjectContainer(location);
    }
    if (type === 'unknow-npm-project') {
      // resultProject = new (getClassFunction('ProjectUnknowNpm'))(location);
      // const ProjectUnknowNpm = require('tnp/lib/project/abstract/project/project').ProjectUnknowNpm;
      resultProject = new ProjectUnknowNpm(location);
    }

    return resultProject as any;
    //#endregion
  }
  //#endregion

  //#region methods / nearest to
  nearestTo<T = Project>(
    absoluteLocation: string,
    options?: { type?: ConfigModels.LibType; findGitRoot?: boolean; onlyOutSideNodeModules?: boolean }): T {
    //#region @backendFunc

    options = options || {};
    const { type, findGitRoot, onlyOutSideNodeModules } = options;

    if (_.isString(type) && !LibTypeArr.includes(type)) {
      Helpers.error(`[firedev-helpers][project.nearestTo] wrong type: ${type}`, false, true)
    }
    if (fse.existsSync(absoluteLocation)) {
      absoluteLocation = fse.realpathSync(absoluteLocation);
    }
    if (fse.existsSync(absoluteLocation) && !fse.lstatSync(absoluteLocation).isDirectory()) {
      absoluteLocation = path.dirname(absoluteLocation);
    }

    let project: Project;
    let previousLocation: string;
    while (true) {
      if (onlyOutSideNodeModules && (path.basename(path.dirname(absoluteLocation)) === 'node_modules')) {
        absoluteLocation = path.dirname(path.dirname(absoluteLocation));
      }
      project = this.From(absoluteLocation);
      if (_.isString(type)) {
        if (project?.typeIs(type)) {
          if (findGitRoot) {
            if (project.git.isGitRoot) {
              break;
            }
          } else {
            break;
          }
        }
      } else {
        if (project) {
          if (findGitRoot) {
            if (project.git.isGitRoot) {
              break;
            }
          } else {
            break;
          }
        }
      }

      previousLocation = absoluteLocation;
      const newAbsLocation = path.join(absoluteLocation, '..');
      if (!path.isAbsolute(newAbsLocation)) {
        return;
      }
      absoluteLocation = crossPlatformPath(path.resolve(newAbsLocation));
      if (!fse.existsSync(absoluteLocation) && absoluteLocation.split('/').length < 2) {
        return;
      }
      if (previousLocation === absoluteLocation) {
        return;
      }
    }
    return project as any;
    //#endregion
  }
  //#endregion

  //#region methods / get class function
  /**
   * @deprecated
   */
  private getClassFunction(className) {
    const classFN = CLASS.getBy(className) as any;
    if (!classFN) {
      Helpers.error(`[firedev-helpers][Project.From] cannot find class function by name ${className}`)
    }
    return classFN;
  }
  //#endregion

  //#region methods / check if type is not correct
  /**
   * @deprecated
   */
  private checkIfTypeIsNotCorrect(type, location) {
    if (_.isString(type) && !LibTypeArr.includes(type as any)) {
      Helpers.error(`Incorrect type: "${type}"

    Please use one of this: ${LibTypeArr.join(',')}

    in
    package.json > ${config.frameworkName}.type

    location: ${location}

    `, false, true);
    }
  }
  //#endregion

}
//#endregion

//#region PROJECT
export class Project extends BaseProject<Project>
{

  //#region static

  //#region static / instace of resolve
  static ins = new FiredevProjectResolve(Project);
  //#endregion

  //#region static / tnp proj
  /**
   * @deprecated
   */
  static get Tnp(): Project {
    //#region @backendFunc
    let tnpPorject = this.ins.From(config.pathes.tnp_folder_location);
    Helpers.log(`Using ${config.frameworkName} path: ${config.pathes.tnp_folder_location}`, 1)
    if (!tnpPorject && !global.globalSystemToolMode) {
      Helpers.error(`Not able to find tnp project in "${config.pathes.tnp_folder_location}".`)
    }
    return tnpPorject;
    //#endregion
  }
  //#endregion

  //#region static / from
  public static From(locationOfProject: string | string[]): Project {
    return this.ins.From(locationOfProject)
  }
  //#endregion

  //#region static / by
  public static by(
    libraryType: ConfigModels.NewFactoryType,
    version: ConfigModels.FrameworkVersion
      //#region @backend
      = config.defaultFrameworkVersion
    //#endregion
  ): Project {
    //#region @backendFunc

    if (libraryType === 'container') {
      const pathToContainer = config.pathes.projectsExamples(version).container;
      const containerProject = Project.From(pathToContainer);
      return containerProject as any;
    }

    if (libraryType === 'single-file-project') {
      const singleFileProject = Project.From(config.pathes.projectsExamples(version).singlefileproject);
      return singleFileProject as any;
    }

    const projectPath = config.pathes.projectsExamples(version).projectByType(libraryType);
    if (!fse.existsSync(projectPath)) {
      Helpers.error(`
     ${projectPath}
     ${projectPath.replace(/\//g, '\\\\')}
     ${crossPlatformPath(projectPath)}
     [firedev-helpers] Bad library type "${libraryType}" for this framework version "${version}"

     `, false, false);
    }
    return this.ins.From(projectPath);
    //#endregion
  }
  //#endregion

  //#region static / curremt
  public static get Current() {
    return this.ins.Current;
  }
  //#endregion

  //#region static / resovle child project
  public static resolveChildProject(args: string | string[]) {
    return this.ins.resolveChildProject(args);
  }
  //#endregion

  //#region static / angular major version for current cli
  static angularMajorVersionForCurrentCli(): number {
    //#region @backendFunc
    const tnp = (Project.Tnp);
    const angularFrameworkVersion = Number(_.first(tnp.version.replace('v', '').split('.')));
    return angularFrameworkVersion;
    //#endregion
  }
  //#endregion

  //#region static / morphi tag to checkout for current cli version
  static morphiTagToCheckoutForCurrentCliVersion(cwd: string): string {
    //#region @backendFunc
    const ngVer = Project.angularMajorVersionForCurrentCli();
    const lastTagForVer = (Project.From(cwd) as Project).git.lastTagNameForMajorVersion(ngVer);
    return lastTagForVer;
    //#endregion
  }
  //#endregion

  //#endregion

  //#region ins
  // @ts-ignore
  public get ins(): FiredevProjectResolve {
    return Project.ins;
  };
  //#endregion

  readonly type: ConfigModels.LibType;

  //#region @backend
  env?: EnvironmentConfig;
  //#endregion
  browser: any;

  get children(): Project[] {
    if (Helpers.isBrowser) {
      return this.browser.children as any;
    }
    //#region @backend

    if (this.pathExists('taon.json')) {
      const taonChildren = Helpers.foldersFrom(this.location)
        .filter(f => !f.startsWith('.') && ![
          config.folder.node_modules,
        ].includes(path.basename(f)))
        .map(f => Project.From(f) as Project)
        .filter(f => !!f);
      // console.log({
      //   taonChildren: taonChildren.map(c => c.location)
      // })
      return taonChildren;
    }

    if (this.isTnp && !global.globalSystemToolMode) {
      return [];
    }
    if (this.typeIs('unknow')) {
      return [];
    }
    const all = this.getAllChildren();
    // console.log({
    //   all: all.map(c => c.location)
    // })
    return all;
    //#endregion
  }

  public setType(this: Project, type: ConfigModels.LibType) {
    // @ts-ignore
    this.type = type;
  }
  public typeIs(this: Project, ...types: ConfigModels.LibType[]) {
    return this.type && types.includes(this.type);
  }

  public typeIsNot(this: Project, ...types: ConfigModels.LibType[]) {
    return !this.typeIs(...types);
  }

  private _projectInfoPort: number;

  setProjectInfoPort(v) {
    //#region @backend
    this._projectInfoPort = v;
    const children = this.children.filter(f => f.location !== this.location);
    for (const child of children) {
      child.setProjectInfoPort(v); // @LAST why error
    }
    //#endregion
  }

  get projectInfoPort() {
    //#region @backendFunc
    let port = this._projectInfoPort;
    if (!port && this.isSmartContainerTarget) {
      return this.smartContainerTargetParentContainer?._projectInfoPort;
    }
    return port;
    //#endregion
  }

  get standaloneNormalAppPort() {
    //#region @backendFunc
    return PortUtils.instance(this.projectInfoPort).calculateClientPortFor(this, { websql: false })
    //#endregion
  }
  get standaloneWebsqlAppPort() {
    //#region @backendFunc
    return PortUtils.instance(this.projectInfoPort).calculateClientPortFor(this, { websql: true })
    //#endregion
  }

  get portsInfo(): string {
    //#region @backendFunc
    return `


    currentPorts.NORMAL_APP ${this.standaloneNormalAppPort} <br>
    currentPorts.WEBSQL_APP ${this.standaloneWebsqlAppPort} <br>

    `;
    //#endregion
  }

  get info(
    //#region @backend
    // @ts-ignore
    this: Project
    //#endregion
  ) {
    if (Helpers.isBrowser) {
      return this.browser.info as any;
    }
    //#region @backend
    return `(${this.type}) ${this.genericName} `;
    //#endregion
  }

  get FiredevProject() {
    return Project.Tnp;
  }


  //#region @backend
  /**
   * DO NOT USE function isWorkspace, isWOrkspace child.. it is to expensive
   */
  constructor(location?: string) {
    super(crossPlatformPath(_.isString(location) ? location : ''));
    if (!global.codePurposeBrowser) { // TODO when on weird on node 12
      this.defineProperty('compilerCache', CompilerCache);
      this.cache = {};
      const PackageJSONClass = CLASS.getBy('PackageJSON') as typeof PackageJSON;
      this.packageJson = PackageJSONClass.fromProject(this);
      this.setType(this.packageJson ? this.packageJson.type : 'unknow');

      this.defineProperty<Project>('quickFixes', QuickFixes);
      this.defineProperty<Project>('node_modules', NodeModules);
      this.defineProperty<Project>('npmPackages', NpmPackages);
      this.defineProperty<Project>('recreate', FilesRecreator);
      this.defineProperty<Project>('filesFactory', FilesFactory);
      this.defineProperty<Project>('filesTemplatesBuilder', FilesTemplatesBuilder);
      // console.log({
      //   MochaTestRunner, JestTestRunner, CypressTestRunner,
      // })
      this.defineProperty<Project>('tests', MochaTestRunner);
      this.defineProperty<Project>('testsJest', JestTestRunner);
      this.defineProperty<Project>('testsCypress', CypressTestRunner);
      Project.ins.add(this);
      this.defineProperty<Project>('env', EnvironmentConfig);
      this.defineProperty<Project>('copyManager', CopyManager);
      this.defineProperty<Project>('filesStructure', FilesStructure);
      this.defineProperty<Project>('buildProcess', BuildProcessFeature);
      this.defineProperty<Project>('targetProjects', TargetProject);
      this.defineProperty<Project>('gitActions', GitActions);
      this.defineProperty<Project>('smartNodeModules', SmartNodeModules);
      this.defineProperty<Project>('insideStructure', InsideStructures);
      this.defineProperty<Project>('singluarBuild', SingularBuild);
      this.defineProperty<Project>('webpackBackendBuild', WebpackBackendCompilation);
      this.defineProperty<Project>('linkedRepos', LinkedRepos);
      this.defineProperty<Project>('branding', Branding);
      this.defineProperty<Project>('docsAppBuild', DocsAppBuildConfig);
      this.defineProperty<Project>('assetsManager', AssetsManager);
      this.defineProperty<Project>('assetsFileListGenerator', AssetsFileListGenerator);
      this.libProjectInit();
    }

  }
  //#endregion
}

//#region  classes join

//#region @backend
// @ts-ignore
export interface Project extends
  BaseFiredevProject,
  NpmProject,
  FeatureProject,
  FiredevProject,
  FolderProject,
  LibProject,
  VscodeProject,
  FiredevProject,
  RecreatableProject,
  EntityProject,
  BuildableProject,
  ElectronProject,
  DependencyProject,
  CompilerCache {

}
//#endregion

//#region @backend
Helpers.applyMixins(Project, [
  BaseFiredevProject,
  NpmProject,
  FeatureProject,
  FiredevProject,
  FolderProject,

  LibProject,
  VscodeProject,

  RecreatableProject,
  EntityProject,
  BuildableProject,
  ElectronProject,
  DependencyProject,
  CompilerCache
])
//#endregion
//#endregion

//#endregion

//#region PROJECT CONTAINER
@CLASS.NAME('ProjectContainer')
export class ProjectContainer
  //#region @backend
  extends Project
//#endregion
{

  async initProcedure() {
    //#region @backendFunc
    this.addGitReposAsLinkedProjects();
    //#endregion
  }

  public addGitReposAsLinkedProjects() {
    //#region @backendFunc
    const repoChilds = this.getFoldersForPossibleProjectChildren()
      .sort()
      .map(c => {
        const proj = Project.From(c);
        if (!proj) {
          Helpers.log(`No project from ${c}`);
        }
        return proj;
      })
      .filter(f => !!f)
      .filter(c => c.git.isGitRoot)
      .map(c => c.name);


    // TODO Too much things to check here
    // let chagned = false;

    // repoChilds.forEach(name => {
    //   if (_.isUndefined(this.packageJson.linkedProjects.find(p => p === name))
    //     && Project.From(path.join(this.location, name))?.git.isGitRepo) {
    //     chagned = true;
    //     this.packageJson.linkedProjects.push(name);
    //   }
    // });
    // if (chagned) {
    //   this.packageJson.writeToDisc();
    // }
    //#endregion
  }

  async buildLib() { }

  filesTemplates() {
    //#region @backendFunc
    let templates = super.filesTemplates();
    if (this.isSmartContainer) {
      templates = [
        'tsconfig.json.filetemplate',
        ...templates,
      ]
    }
    return templates;
    //#endregion
  }

  startOnCommand() {
    //#region @backendFunc
    return 'echo "no container support jet"';
    //#endregion
  }

  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    if (this.isSmartContainer) {
      return [
        ...this.filesTemplates(),
        // 'tsconfig.json',
        // ...this.vscodeFileTemplates,
      ]
    }
    return [

    ];
    //#endregion
  }

  proxyProjFor(client: string, outFolder: Models.dev.BuildDir): ProjectIsomorphicLib {
    //#region @backendFunc
    return Project.From(SingularBuild.getProxyProj(this, client, outFolder)) as any;
    //#endregion
  }

  async buildSteps(buildOptions?: BuildOptions, libBuildDone?: () => void) {
    //#region @backend
    if (!fse.existsSync(this.location)) {
      return;
    }
    let { outDir, args } = buildOptions;

    args = Helpers.cliTool.removeArgFromString(args, argsToClear);
    let client = Helpers.removeSlashAtEnd(_.first((args || '').split(' '))) as any;
    if (!client) {
      client = this.smartContainerBuildTarget?.name;
    }

    const proxyForTarget = this.proxyProjFor(this.smartContainerBuildTarget?.name, outDir);
    if (!proxyForTarget) {
      Helpers.error(`Please start lib build for smart container:
     ${config.frameworkName} build:dist:watch
     or
     ${config.frameworkName} dev
     or
     ${config.frameworkName} build:watch # for global build

      `, false, true)
    }

    let proxy = this.proxyProjFor(client, outDir);

    if (!proxy && this.isSmartContainer) {
      const tmp = (c) => `${config.frameworkName} build:app:watch ${c}`;
      Helpers.error(`

      Please provide target for angular build:

${this.children.filter(c => c.typeIs('isomorphic-lib')).map(c => {
        return tmp(c.name);
      }).join('\n')}

      or please update:
      ...
      linkedProjects: [ ... ]
      ...
      in you configuraiton and run: firedev init


      `, false, true);
    }
    await proxy.buildSteps(buildOptions, libBuildDone);

    //#endregion
  }
}
//#endregion

//#region PROJECT ISOMORPHIC LIB
//#region consts
// const loadNvm = ''// 'echo ' // 'export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use v14';
//#endregion
@CLASS.NAME('ProjectIsomorphicLib')
export class ProjectIsomorphicLib
  //#region @backend
  extends Project
//#endregion
{
  //#region static

  //#region static / get angular project proxy path
  //#region @backend
  public static angularProjProxyPath(
    project: Project,
    outFolder?: ConfigModels.OutFolder,
    client?: string,
    websql?: boolean,
    type: 'app' | 'lib' = 'app'
  ) {
    const pref = ((type === 'app') ? 'apps' : 'libs')

    const tmpProjectsStandalone = `tmp-${pref}-for-{{{outFolder}}}${websql ? '-websql' : ''}/${project.name}`;
    const tmpProjects = `tmp-${pref}-for-{{{outFolder}}}${websql ? '-websql' : ''}/${project.name}--for--{{{client}}}`;
    if (project.isStandaloneProject) {
      if (outFolder) {
        return tmpProjectsStandalone.replace('{{{outFolder}}}', outFolder);
      }
      return tmpProjectsStandalone;
    }
    if (outFolder && client) {
      return tmpProjects.replace('{{{outFolder}}}', outFolder).replace('{{{client}}}', client);
    }
    return tmpProjects;
  }
  //#endregion
  //#endregion

  //#endregion

  //#region fields / getters
  private npmRunNg = `npm-run ng`; // when there is not globl "ng" command -> npm-run ng.js works

  get ignoreInV3() {
    const files = [
      'angular.json.filetemplate',
      'ngsw-config.json.filetemplate',
    ];
    return [
      ...files,
      ...files.map(f => f.replace('.filetemplate', '')),
    ]
  }

  get forAppRelaseBuild() {
    //#region @backendFunc
    return (this.buildOptions?.args?.trim()?.search('--forAppRelaseBuild') !== -1);
    //#endregion
  };

  //#endregion

  //#region methods

  //#region methods / source files to ignore
  sourceFilesToIgnore() {
    //#region @backendFunc
    let toIgnore = [
      `src/${config.file.entities_ts}`,
      `src/${config.file.controllers_ts}`,
    ];
    return toIgnore;
    //#endregion
  }
  //#endregion

  //#region methods / project specyfic files
  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    let files = super.projectSpecyficFiles()
      .concat([
        'tsconfig.browser.json',
        'webpack.config.js',
        'webpack.backend-dist-build.js',
        'run.js',
        'run-org.js',
        ...this.filesTemplates(),
      ]).concat(
        !this.isStandaloneProject ? [
          'src/typings.d.ts',
        ] : []);

    if (this.frameworkVersionAtLeast('v2')) {
      files = files.filter(f => f !== 'tsconfig.browser.json');
    }

    if (this.frameworkVersionAtLeast('v3')) {
      files = files.filter(f => !this.ignoreInV3.includes(f));
    }

    return files;
    //#endregion
  }
  //#endregion

  //#region methods / files templates
  filesTemplates() {
    //#region @backendFunc
    let files = [
      'tsconfig.json.filetemplate',
      'tsconfig.backend.dist.json.filetemplate',
    ];

    if (this.frameworkVersionAtLeast('v2')) {
      files = [
        'tsconfig.isomorphic.json.filetemplate',
        'tsconfig.isomorphic-flat-dist.json.filetemplate',
        'tsconfig.browser.json.filetemplate',
        ...this.vscodeFileTemplates,
        ...files,
      ];
    }

    if (this.frameworkVersionAtLeast('v3')) {
      files = files.filter(f => !this.ignoreInV3.includes(f))
    }

    return files;
    //#endregion
  }
  //#endregion

  //#region methods / project linked files
  projectLinkedFiles() {
    //#region @backendFunc
    const files = super.projectLinkedFiles();

    if (this.frameworkVersionAtLeast('v2')) {
      files.push({
        sourceProject: Project.by(this.type, 'v1'),
        relativePath: 'webpack.backend-dist-build.js'
      });
    }

    return files;
    //#endregion
  }
  //#endregion

  //#region methods / project specyfic ignored files
  projectSpecyficIgnoredFiles() {
    //#region @backendFunc
    return [
      // 'src/entities.ts',
      // 'src/controllers.ts'
    ].concat(this.projectSpecyficFiles());
    //#endregion
  }
  //#endregion

  //#region methods / build steps
  async buildSteps(buildOptions?: BuildOptions, libBuildDone?: () => void) {
    //#region @backendFunc
    this.buildOptions = buildOptions;
    const { prod, watch, outDir, onlyWatchNoBuild, appBuild, args, forClient = [], baseHref, websql } = buildOptions;

    if (!onlyWatchNoBuild) {
      if (appBuild) {
        await this.buildApp(outDir, watch, forClient as any, buildOptions.args, baseHref, prod, websql);
      } else {
        await this.buildLib(libBuildDone);
      }
    }

    //#endregion
  }
  //#endregion

  //#endregion

  //#region api

  //#region api / init procedure
  async initProcedure() {
    //#region @backend
    if (this.isCoreProject && this.frameworkVersionAtLeast('v2')) {

    }
    //#endregion
  }
  //#endregion

  //#region api / start on command

  startOnCommand(args: string) {
    //#region @backendFunc
    const command = `ts-node run.js ${args}`;
    return command;
    //#endregion
  }
  //#endregion

  //#region api / build app
  async buildApp(
    //#region options
    //#region @backend
    outDir: Models.dev.BuildDir,
    watch: boolean,
    forClient: Project[] | string[],
    args: string,
    baseHref: string,
    prod: boolean,
    websql: boolean,
    //#endregion
    //#endregion
  ) {
    //#region @backend

    //#region prepare variables

    //#region prepare variables / baseHref

    const isSmartContainerTarget = this.isSmartContainerTarget;
    const isSmartContainerTargetNonClient = this.isSmartContainerTargetNonClient;

    let basename = ''
    if (this.isInRelaseDist) {
      if (!this.env.config?.useDomain) {
        basename = `--base-href /${isSmartContainerTarget ? this.smartContainerTargetParentContainer.name : this.name}/`;
        if (isSmartContainerTargetNonClient) {
          basename = `--base-href /${isSmartContainerTarget ? this.smartContainerTargetParentContainer.name : this.name}/-/${this.name}/`;
        }
      }
    }

    //#endregion

    //#region prepare variables / webpack params
    let webpackEnvParams = `--env.outFolder=${outDir}`;
    webpackEnvParams = webpackEnvParams + (watch ? ' --env.watch=true' : '');


    const backAppTmpFolders = `../../`;
    const backeFromRelase = `../../../../`;
    const backeFromContainerTarget = `../../../`;
    let back = backAppTmpFolders;
    if (this.isInRelaseDist) {
      if (isSmartContainerTarget) {
        back = `${backAppTmpFolders}${backeFromContainerTarget}${backeFromRelase}`;
      } else {
        back = `${backAppTmpFolders}${backeFromRelase}`;
      }
    } else {
      if (isSmartContainerTarget) {
        back = `${backAppTmpFolders}${backeFromContainerTarget}`;
      }
    }

    let outDirApp = this.isInRelaseDist ? config.folder.docs : `${outDir}-app${websql ? '-websql' : ''}`;
    if (isSmartContainerTargetNonClient) {
      outDirApp = `${outDirApp}/-/${this.name}`;
    }

    const outPutPathCommand = `--output-path ${back}${outDirApp} ${basename}`;

    let { flags } = require('minimist')(args.split(' '));
    flags = (_.isString(flags) ? [flags] : []);
    flags = (!_.isArray(flags) ? [] : flags);
    //#endregion

    //#region prepare variables / general variables

    // TODO ?
    // const statsCommand = (!this.isStandaloneProject ? (
    //   this.env.config.name === 'static' ? '--stats-json' : ''
    // ) : '');

    let client = _.first(forClient as Project[]);
    let portAssignedToAppBuild: number;
    if (client) {
      webpackEnvParams = `${webpackEnvParams} --env.moduleName=${client.name}`;
    }

    const argsAdditionalParams: { port: number; } = Helpers.cliTool.argsFrom(args) || {} as any;
    if (_.isNumber(argsAdditionalParams.port)) {
      portAssignedToAppBuild = argsAdditionalParams.port;
    }
    if (!_.isNumber(portAssignedToAppBuild) || !portAssignedToAppBuild) {
      portAssignedToAppBuild = websql ? this.standaloneWebsqlAppPort : this.standaloneNormalAppPort;
    }

    if (!_.isNumber(portAssignedToAppBuild) || !portAssignedToAppBuild) {
      portAssignedToAppBuild = await this.assignFreePort(DEFAULT_PORT.APP_BUILD_LOCALHOST);
    }

    if (watch) {
      await Helpers.killProcessByPort(portAssignedToAppBuild);
    }


    const isStandalone = (this.isStandaloneProject && !isSmartContainerTarget);
    // console.log({ isStandalone, 'this.name': this.name });

    const buildOutDir = this.buildOptions.outDir;
    const parent = (!isStandalone
      ? (isSmartContainerTarget ? this.smartContainerTargetParentContainer : this.parent)
      : void 0
    );

    const additionalReplace = (line: string) => {
      const beforeModule2 = crossPlatformPath(path.join(
        buildOutDir,
        parent.name,
        this.name,
        `tmp-apps-for-${buildOutDir}/${this.name}`
      ));

      // console.log({ beforeModule2 })

      if (line.search(beforeModule2) !== -1) {
        line = line.replace(beforeModule2 + '/', '')
      }

      return line
    };
    //#endregion

    //#region prepare variables / command
    let command: string;
    if (this.frameworkVersionAtLeast('v3')) {
      //#region prepare angular variables for new v3 inside structure build
      const portAssignedToAppBuildCommandPart = _.isNumber(portAssignedToAppBuild) ? `--port=${portAssignedToAppBuild}` : '';
      const aot = flags.includes('aot');
      // const ngBuildCmd = // TODO LOAD NVME HERE
      const ngBuildCmd = `npm-run ng build app`
        + `${aot ? '--aot=true' : ''} `
        + `${prod ? '--configuration production' : ''} `
        + `${watch ? '--watch' : ''}`
        + `${outPutPathCommand} `

      if (watch) {
        if (outDir === 'dist') {
          // command = `${loadNvm} && ${this.npmRunNg} serve ${portToServe} ${prod ? '--prod' : ''}`;
          const isElectron = false;
          command = `${this.npmRunNg} serve ${isElectron ? 'angular-electron' : 'app'}  ${portAssignedToAppBuildCommandPart} ${prod ? '--prod' : ''}`;
        } else {
          command = ngBuildCmd;
        }
      } else {
        command = ngBuildCmd;
      }
      //#endregion
    } else {
      //#region @deprecated prepare webpack variables
      if (_.isNumber(portAssignedToAppBuild)) {
        webpackEnvParams = `${webpackEnvParams} --env.port=${portAssignedToAppBuild}`;
      }
      command = `npm-run webpack-dev-server ${webpackEnvParams}`;
      //#endregion
    }
    //#endregion

    //#region prepare variables / @depracated  workspace simulated app
    if (!global.tnpNonInteractive) {
      if (!this.isStandaloneProject && forClient.length === 0) {
        const answer: { project: string } = await inquirer
          .prompt([
            {
              type: 'list',
              name: 'project',
              message: 'Which project do you wanna simulate ?',
              choices: this.parent.children
                .filter(c => c.typeIs(...config.allowedTypes.app))
                .filter(c => c.name !== this.name)
                .map(c => c.name),
              filter: function (val) {
                return val.toLowerCase();
              }
            }
          ]) as any;
        client = Project.From(path.join(this.location, '..', answer.project));
      }
    }
    //#endregion

    //#region prepare variables / proper project variable
    let proj: Project;
    if (this.frameworkVersionAtLeast('v3')) {
      proj = this.proxyNgProj(this, this.buildOptions);
    } else {
      proj = this;
    }
    //#endregion

    //#region prepare variables / angular info
    const showInfoAngular = () => {
      Helpers.log(`

  ANGULAR BUILD APP COMMAND: ${command}

  inside: ${proj.location}

  `);
    };
    //#endregion

    //#endregion

    showInfoAngular();

    await proj.execute(command, {
      resolvePromiseMsg: {
        stdout: 'Compiled successfully'
      },
      //#region command execute params
      exitOnError: true,
      exitOnErrorCallback: async (code) => {
        Helpers.error(`[${config.frameworkName}] Typescript compilation error (code=${code})`
          , false, true);
      },
      outputLineReplace: (line: string) => {
        //#region replace outut line for better debugging
        if (isStandalone) {
          return line.replace(
            `src/app/${this.name}/`,
            `./src/`
          );
        } else {
          line = line.trim();

          if (line.search('src/app/') !== -1) {
            line = line.replace('src/app/', './src/app/');
            line = line.replace('././src/app/', './src/app/');
          }

          if (line.search(`src/app/${this.name}/libs/`) !== -1) {
            const [__, ___, ____, _____, ______, moduleName] = line.split('/');
            return additionalReplace(line.replace(
              `src/app/${this.name}/libs/${moduleName}/`,
              `${moduleName}/src/lib/`,
            ));
          }

          if (line.search(`src/app/`) !== -1) {
            const [__, ___, ____, moduleName] = line.split('/');
            return additionalReplace(line.replace(
              `src/app/${moduleName}/`,
              `${moduleName}/src/`,
            ));
          }
          return additionalReplace(line);
        }
        //#endregion
      },
      //#endregion
    });
    //#endregion
  }
  //#endregion

  //#region api / build lib
  async buildLib(libBuildDone?: () => void) {
    //#region @backend

    //#region preparing variables

    //#region preparing variables & fixing things
    const { outDir, ngbuildonly, watch, args } = this.buildOptions;

    this.fixBuildDirs(outDir);

    // Helpers.info(`[buildLib] start of building ${websql ? '[WEBSQL]' : ''}`);
    Helpers.log(`[buildLib] start of building...`);
    this.copyEssentialFilesTo([crossPlatformPath([this.pathFor(outDir)])], outDir);

    const { codeCutRelease } = require('minimist')((args || '').split(' '));

    const { obscure, uglify, nodts, includeNodeModules, serveApp } = this.buildOptions;
    const productionModeButIncludePackageJsonDeps = (obscure || uglify) && !includeNodeModules;


    if (this.isInRelaseDist && (obscure || uglify)) { // @LAST
      this.quickFixes.overritenBadNpmPackages();
    }

    if (productionModeButIncludePackageJsonDeps) {
      this.buildOptions.genOnlyClientCode = true;
    }
    //#endregion

    //#region preparing variables / incremental build
    const incrementalBuildProcess = new IncrementalBuildProcess(this, this.buildOptions.clone({
      websql: false
    }));

    const incrementalBuildProcessWebsql = new IncrementalBuildProcess(this, this.buildOptions.clone({
      websql: true,
      genOnlyClientCode: true,
    }));

    const proxyProject = this.proxyNgProj(this, this.buildOptions.clone({
      websql: false,
    }), 'lib');

    const proxyProjectWebsql = this.proxyNgProj(this, this.buildOptions.clone({
      websql: true
    }), 'lib');

    Helpers.log(`

    proxy Proj = ${proxyProject?.location}
    proxy Proj websql = ${proxyProjectWebsql?.location}

    `);

    //#endregion

    //#region preparing variables / general
    const isStandalone = (!this.isSmartContainer);

    const sharedOptions = () => {
      return {
        exitOnError: true,
        exitOnErrorCallback: async (code) => {
          Helpers.error(`[${config.frameworkName}] Typescript compilation lib error (code=${code})`
            , false, true);
        },
        outputLineReplace: (line: string) => {
          if (isStandalone) {
            if (line.startsWith('WARNING: postcss-url')) {
              return ' --- [firedev] IGNORED WARN ---- ';
            }

            line = line.replace(
              `projects/${this.name}/src/`,
              `./src/`
            );

            if (line.search(`/src/libs/`) !== -1) {
              const [__, ___, ____, moduleName] = line.split('/');
              // console.log({
              //   moduleName,
              //   standalone: 'inlib'
              // })
              return line.replace(
                `/src/libs/${moduleName}/`,
                `/${moduleName}/src/lib/`,
              );
            }

            return line;
          }
          return line;
        },
      } as ExecuteOptions;
    };
    //#endregion

    //#region prepare variables / command
    // const command = `${loadNvm} && ${this.npmRunNg} build ${this.name} ${watch ? '--watch' : ''}`;
    const commandForLibraryBuild = `${this.npmRunNg} build ${this.name} ${watch ? '--watch' : ''}`;
    //#endregion

    //#region prepare variables / angular info
    const showInfoAngular = () => {
      Helpers.info(`Starting browser Angular/TypeScirpt build.... ${this.buildOptions.websql ? '[WEBSQL]' : ''}`);
      Helpers.log(`

      ANGULAR 13+ ${this.buildOptions.watch ? 'WATCH ' : ''} LIB BUILD STARTED... ${this.buildOptions.websql ? '[WEBSQL]' : ''}

      `);

      Helpers.log(` command: ${commandForLibraryBuild}`);
    };
    //#endregion

    //#endregion

    if (this.buildOptions.watch) {
      if (productionModeButIncludePackageJsonDeps) {
        //#region webpack dist release build
        await incrementalBuildProcess.startAndWatch(`isomorphic compilation (only browser) `);
        await incrementalBuildProcessWebsql.startAndWatch(`isomorphic compilation (only browser) [WEBSQL]`);
        // Helpers.error(`Watch build not available for dist release build`, false, true);
        // Helpers.info(`Starting watch dist release build for fast cli.. ${this.buildOptions.websql ? '[WEBSQL]' : ''}`);
        Helpers.info(`Starting watch dist release build for fast cli.. `);

        try {
          await this.webpackBackendBuild.run({
            appBuild: false,
            outDir,
            watch,
          });
        } catch (er) {
          Helpers.error(`WATCH ${outDir.toUpperCase()} build failed`, false, true);
        }
        //#endregion
      } else {
        //#region watch backend compilation
        await incrementalBuildProcess.startAndWatch('isomorphic compilation (watch mode)',
          //#region options
          {
            watchOnly: this.buildOptions.watchOnly,
            afterInitCallBack: async () => {
              await this.compilerCache.setUpdatoDate.incrementalBuildProcess();
            }
          }
          //#endregion
        );

        await incrementalBuildProcessWebsql.startAndWatch('isomorphic compilation (watch mode) [WEBSQL]',
          //#region options
          {
            watchOnly: this.buildOptions.watchOnly,
            afterInitCallBack: async () => {
              await this.compilerCache.setUpdatoDate.incrementalBuildProcess();
            }
          }
          //#endregion
        );

        if (this.frameworkVersionAtLeast('v3')) { // TOOD
          showInfoAngular()

          if (isStandalone || (this.isSmartContainerTarget && this.buildOptions.copyto?.length > 0)) {
            if (this.isSmartContainerTarget) { // TODO QUICK_FIX this should be in init/struct
              PackagesRecognition.fromProject(this).start(true, 'before startling lib proxy project');
            }
            await proxyProject.execute(commandForLibraryBuild, {
              resolvePromiseMsg: {
                stdout: 'Compilation complete. Watching for file changes'
              },
              ...sharedOptions(),
            });
            await proxyProjectWebsql.execute(commandForLibraryBuild, {
              resolvePromiseMsg: {
                stdout: 'Compilation complete. Watching for file changes'
              },
              ...sharedOptions(),
            });
          }

          // console.log({
          //   libBuildDone,
          //   serveApp,
          // })
          if (libBuildDone) {
            await Helpers.runSyncOrAsync(libBuildDone);
          }

          if (serveApp) {
            const appBuildOpt = this.buildOptions.clone();
            appBuildOpt.appBuild = true;
            await this.buildSteps(appBuildOpt);
          } else {
            this.showMesageWhenBuildLibDoneForSmartContainer(args, watch, this.isInRelaseDist);
          }
        }
        //#endregion
      }
    } else {
      //#region non watch build
      if (codeCutRelease) {
        this.cutReleaseCode();
      }

      if (productionModeButIncludePackageJsonDeps) {
        //#region release production backend build for firedev/tnp specyfic
        // console.log('k1')
        await incrementalBuildProcess.start('isomorphic compilation (only browser) ');
        await incrementalBuildProcessWebsql.start('isomorphic compilation (only browser) [WEBSQL] ');

        try {
          await this.webpackBackendBuild.run({
            appBuild: false,
            outDir,
            watch,
          });
        } catch (er) {
          Helpers.error(`${outDir.toUpperCase()} (single file compilation) build failed`, false, true);
        }

        if (nodts) {
          //#region fix webpack dt
          const baseDistGenWebpackDts = crossPlatformPath(path.join(this.location, outDir, 'dist'));
          Helpers
            .filesFrom(baseDistGenWebpackDts, true)
            .forEach(absSource => {
              const destDtsFile = path.join(
                this.location,
                outDir,
                absSource.replace(`${baseDistGenWebpackDts}/`, '')
              );
              Helpers.copyFile(absSource, destDtsFile);
            });
        }
        Helpers.removeIfExists(path.join(this.location, outDir, 'dist'));

        try {
          if (obscure || uglify) {
            this.backendCompileToEs5(outDir);
          }
          if (uglify) {
            this.backendUglifyCode(outDir, config.reservedArgumentsNamesUglify)
          };
          if (obscure) {
            this.backendObscureCode(outDir, config.reservedArgumentsNamesUglify);
          }
          // process.exit(0)
        } catch (er) {
          Helpers.error(`${outDir.toUpperCase()} (obscure || uglify) process failed`, false, true);
        }

        try {
          showInfoAngular()
          await proxyProject.execute(commandForLibraryBuild, {
            ...sharedOptions()
          })
          await proxyProjectWebsql.execute(commandForLibraryBuild, {
            ...sharedOptions()
          })
        } catch (e) {
          Helpers.log(e)
          Helpers.error(`
          Command failed: ${commandForLibraryBuild}

          Not able to build project: ${this.genericName}`, false, true)
        }
        //#endregion
      } else {
        //#region normal backend compilation

        await incrementalBuildProcess.start('isomorphic compilation');
        await incrementalBuildProcessWebsql.start('isomorphic compilation');

        try {
          showInfoAngular();
          await proxyProject.execute(commandForLibraryBuild, {
            ...sharedOptions(),
          });
          await proxyProjectWebsql.execute(commandForLibraryBuild, {
            ...sharedOptions(),
          });
          this.showMesageWhenBuildLibDoneForSmartContainer(args, watch, this.isInRelaseDist);
        } catch (e) {
          Helpers.log(e)
          Helpers.error(`
          Command failed: ${commandForLibraryBuild}

          Not able to build project: ${this.genericName}`, false, true)
        }

        //#endregion
      }

      if (includeNodeModules) {
        const cliJsFile = 'cli.js';
        this.backendIncludeNodeModulesInCompilation(
          outDir,
          false, // uglify,
          cliJsFile,
        );
        if (uglify) {
          this.backendUglifyCode(outDir, config.reservedArgumentsNamesUglify, cliJsFile)
        };
        if (!productionModeButIncludePackageJsonDeps) {
          if (obscure || uglify) {
            this.backendCompileToEs5(outDir, cliJsFile);
          }
          if (obscure) {
            this.backendObscureCode(outDir, config.reservedArgumentsNamesUglify, cliJsFile);
          }
        }
      }

      if (nodts) {
        this.backendRemoveDts(outDir);
      }


      if (codeCutRelease) {
        this.cutReleaseCodeRestore();
      }
      //#endregion
      //#endregion
    }

    //#endregion
  }
  //#endregion

  //#endregion

  //#region private methods

  //#region private methods / show message when build lib done for smart container
  private showMesageWhenBuildLibDoneForSmartContainer(args: string, watch: boolean, isInRelease: boolean) {
    //#region @backend
    if (this.forAppRelaseBuild) {
      Helpers.logInfo('Lib build for app done...  starting app build');
      return;
    }
    if (isInRelease) {
      Helpers.logInfo('Release lib build done... ');
      return;
    }
    const buildLibDone = `LIB BUILD DONE.. `;
    const ifapp = 'if you want to start app build -> please run in other terminal command:';

    const ngserve = `${watch ? '--port 4201 # or whatever port' : '#'} to run angular ${watch
      ? 'ng serve'
      : 'ng build (for application - not lib)'
      }.`;
    const bawOrba = watch ? 'baw' : 'ba';
    const bawOrbaLong = watch ? ' build:app:watch ' : ' build:app ';
    const bawOrbaLongWebsql = watch ? 'build:app:watch --websql' : 'build:app --websql';
    const withPort = '(with custom port - otherwise automatically selected)';
    const orIfWebsql = `or if you want to try websql mode:`;



    if (this.isSmartContainerTarget) {
      const parent = this.smartContainerTargetParentContainer;
      args = Helpers.cliTool.removeArgFromString(args, argsToClear);
      const target = (crossPlatformPath(_.first(args.split(' '))) || '').replace('/', '');

      Helpers.taskDone(`${CLI.chalk.underline(`

      ${buildLibDone}... for target project "`
        + `${parent ? (parent.name + '/') : ''}${target}"`)}`)

      Helpers.success(`

      ${ifapp}

      ${CLI.chalk.bold(config.frameworkName + bawOrbaLong + target)}
      or
      ${config.frameworkName} ${bawOrba} ${target}

      ${withPort}
      ${config.frameworkName} ${bawOrba} ${target} ${ngserve}

      ${orIfWebsql}
      ${config.frameworkName} ${bawOrbaLongWebsql}

            `);
    } else if (this.isStandaloneProject) {
      Helpers.taskDone(`${CLI.chalk.underline(`${buildLibDone}...`)}`)
      Helpers.success(`

      ${ifapp}

      ${CLI.chalk.bold(config.frameworkName + bawOrbaLong)}
      or
      ${config.frameworkName} ${bawOrba}

      ${withPort}
      ${config.frameworkName} ${bawOrba} ${ngserve}

      ${orIfWebsql}
      ${bawOrbaLongWebsql}

      `);
    }
    //#endregion
  }

  //#endregion

  //#region private methods / fix build dirs
  private fixBuildDirs(outDir: Models.dev.BuildDir) {
    //#region @backend
    const p = path.join(this.location, outDir);
    if (!Helpers.isFolder(p)) {
      Helpers.remove(p);
      Helpers.mkdirp(p);
    }
    //#endregion
  }
  //#endregion

  //#region private methods / get proxy ng projects
  private proxyNgProj(project: Project, buildOptions: BuildOptions, type: 'app' | 'lib' = 'app') {
    //#region @backendFunc
    const projepath = crossPlatformPath(path.join(this.location, ProjectIsomorphicLib.angularProjProxyPath(
      project,
      buildOptions.outDir as any,
      void 0, // TODO
      buildOptions.websql,
      type
    )));
    const proj = Project.From(projepath);
    return proj as Project;
    //#endregion
  }
  //#endregion

  //#region private methods / compile backend declaration files
  private backendCompilerDeclarationFiles(outDir: Models.dev.BuildDir) {
    //#region @backend
    this.run(`npm-run tsc --emitDeclarationOnly --declarationDir ${outDir}`).sync();
    //#endregion
  }
  //#endregion

  //#region private methods / include node_modules in compilation
  private backendRemoveDts(outDir: Models.dev.BuildDir) {
    //#region @backend
    Helpers
      .filesFrom([this.location, outDir, 'lib'], true)
      .filter(f => f.endsWith('.d.ts'))
      .forEach(f => Helpers.removeFileIfExists(f))
      ;
    Helpers.writeFile([this.location, outDir, 'lib/index.d.ts'], `export declare const dummy${(new Date()).getTime()};`);
    //#endregion
  }
  //#endregion

  //#region private methods / include node_modules in compilation
  private backendIncludeNodeModulesInCompilation(outDir: Models.dev.BuildDir, uglify: boolean, mainCliJSFileName: string = config.file.index_js) {
    //#region @backend

    // QUICK_FIX TODO ncc input change does not work (it takes always index.js)
    //#region QUICK_FIX
    const indexOrg = this.pathFor(`${outDir}/${config.file.index_js}`);
    const indexOrgBackup = this.pathFor(`${outDir}/${config.file.index_js}-backup`);
    const mainFileAbs = this.pathFor(`${outDir}/${mainCliJSFileName}`);
    const useBackupFile = (mainCliJSFileName !== config.file.index_js);
    if (useBackupFile) {
      Helpers.copyFile(indexOrg, indexOrgBackup);
    }
    //#endregion

    const nccComand = `ncc build ${outDir}/${config.file.index_js} -o ${outDir}/temp/ncc ${uglify ? '-m' : ''}  --no-cache `;
    // console.log({
    //   useBackupFile,
    //   indexOrg,
    //   indexOrgBackup,
    //   nccComand
    // })
    this.run(nccComand).sync();
    // Helpers
    //   .filesFrom([this.location, outDir, 'lib'], true)
    //   .filter(f => f.endsWith('.js') || f.endsWith('.js.map'))
    //   .forEach(f => Helpers.removeFileIfExists(f))
    //   ;

    const baseDistRelease = crossPlatformPath(path.join(this.location, outDir));
    const nccBase = crossPlatformPath(path.join(this.location, outDir, 'temp', 'ncc'));

    Helpers
      .filesFrom(nccBase, true)
      .filter(f => f.replace(`${nccBase}/`, '') !== config.file.package_json)
      .forEach(f => {
        const relativePath = f.replace(`${nccBase}/`, '');
        const dest = crossPlatformPath(path.join(baseDistRelease, relativePath));
        Helpers.copyFile(f, dest);
      });

    Helpers.removeFolderIfExists(path.dirname(nccBase));

    // remove dependencies
    const pjPath = this.pathFor(`${outDir}/${config.file.package_json}`);
    const pj: Models.npm.IPackageJSON = Helpers.readJson(pjPath);
    Object.keys(pj.dependencies).forEach(name => {
      if (!['ora'].includes(name)) { // TODO QUICK FIX FOF TNP
        delete pj.dependencies[name];
      }
    })
    pj.peerDependencies = {};
    pj.devDependencies = {};
    Helpers.removeFileIfExists(pjPath);
    Helpers.writeFile(pjPath, pj);

    if (useBackupFile) {
      Helpers.copyFile(indexOrg, mainFileAbs);
      Helpers.copyFile(indexOrgBackup, indexOrg);
    }
    Helpers.removeIfExists(indexOrgBackup);

    //#endregion
  }
  //#endregion

  //#region private methods / compile backend es5
  /**
   * TODO not working
   */
  private backendCompileToEs5(outDir: Models.dev.BuildDir, mainCliJSFileName = 'index.js') {
    return;
    //#region @backend
    if (!Helpers.exists(path.join(this.location, outDir, 'index.js'))) {
      Helpers.warn(`[compileToEs5] Nothing to compile to es5... no index.js in ${outDir}`)
      return;
    }
    const indexEs5js = `index-es5.js`;
    Helpers.writeFile(path.join(this.location, outDir, config.file._babelrc), '{ "presets": ["env"] }\n');
    this.run(`npm-run babel  ./${outDir}/index.js --out-file ./${outDir}/${indexEs5js}`).sync();
    Helpers.writeFile(
      path.join(this.location, outDir, config.file.index_js),
      Helpers.readFile(path.join(this.location, outDir, indexEs5js))
    );
    Helpers.removeFileIfExists(path.join(this.location, outDir, indexEs5js));
    Helpers.removeFileIfExists(path.join(this.location, outDir, config.file._babelrc));
    //#endregion
  }
  //#endregion

  //#region private methods / compile/uglify backend code
  private backendUglifyCode(outDir: Models.dev.BuildDir, reservedNames: string[], mainCliJSFileName = 'index.js') {
    //#region @backendFunc
    if (!Helpers.exists(path.join(this.location, outDir, mainCliJSFileName))) {
      Helpers.warn(`[uglifyCode] Nothing to uglify... no ${mainCliJSFileName} in /${outDir}`)
      return
    }
    const command = `npm-run uglifyjs ${outDir}/${mainCliJSFileName} --output ${outDir}/${mainCliJSFileName} -b`
      + ` --mangle reserved=[${reservedNames.map(n => `'${n}'`).join(',')}]`
    // + ` --mangle-props reserved=[${reservedNames.join(',')}]` // it breakes code

    Helpers.info(`

    JAVASCRIPT-UGLIFY PROCESSING...

    ${command}

      `)
    this.run(command).sync();
    //#endregion
  }
  //#endregion

  //#region private methods / compile/obscure backend code
  private backendObscureCode(outDir: Models.dev.BuildDir, reservedNames: string[], mainCliJSFileName = 'index.js') {
    //#region @backendFunc
    if (!Helpers.exists(path.join(this.location, config.folder.dist, mainCliJSFileName))) {
      Helpers.warn(`[obscureCode] Nothing to obscure... no ${mainCliJSFileName} in release dist`)
      return
    }
    const commnad = `npm-run javascript-obfuscator dist/${mainCliJSFileName} `
      + ` --output dist/${mainCliJSFileName}`
      + ` --target node`
      + ` --string-array-rotate true`
      // + ` --stringArray true`
      + ` --string-array-encoding base64`
      + ` --reserved-names '${reservedNames.join(',')}'`
      + ` --reserved-strings '${reservedNames.join(',')}'`

    Helpers.info(`

        JAVASCRIPT-OBFUSCATOR PROCESSING...

        ${commnad}

          `)
    this.run(commnad).sync();
    //#endregion
  }
  //#endregion

  //#region private methods / cut release code

  private get tmpSrcDistReleaseFolder() {
    //#region @backendFunc
    return `tmp-cut-relase-src-${config.folder.dist}${this.buildOptions.websql ? '-websql' : ''}`;
    //#endregion
  }

  private cutReleaseCodeRestore() {
    //#region @backend
    const releaseSrcLocation = crossPlatformPath(path.join(this.location, config.folder.src));
    const releaseSrcLocationOrg = crossPlatformPath(path.join(this.location, this.tmpSrcDistReleaseFolder));

    Helpers.removeFolderIfExists(releaseSrcLocation);
    Helpers.copy(releaseSrcLocationOrg, releaseSrcLocation);

    //#endregion
  }

  private cutReleaseCode() {
    //#region @backend
    const releaseSrcLocation = crossPlatformPath(path.join(this.location, config.folder.src));
    const releaseSrcLocationOrg = crossPlatformPath(path.join(this.location, this.tmpSrcDistReleaseFolder));
    Helpers.removeFolderIfExists(releaseSrcLocationOrg);
    Helpers.copy(releaseSrcLocation, releaseSrcLocationOrg, {
      copySymlinksAsFiles: true,
      copySymlinksAsFilesDeleteUnexistedLinksFromSourceFirst: true,
      recursive: true,
    });
    Helpers.removeFolderIfExists(releaseSrcLocation);
    Helpers.copy(releaseSrcLocationOrg, releaseSrcLocation);

    const filesForModyficaiton = glob.sync(`${releaseSrcLocation}/**/*`);
    filesForModyficaiton
      .filter(absolutePath => !Helpers.isFolder(absolutePath) && extAllowedToReplace.includes(path.extname(absolutePath)))
      .forEach(absolutePath => {
        let rawContent = Helpers.readFile(absolutePath);
        rawContent = RegionRemover.from(
          absolutePath,
          rawContent,
          [TAGS.NOT_FOR_NPM],
          this.project,
        ).output;
        // rawContent = this.replaceRegionsWith(rawContent, ['@notFor'+'Npm']);
        Helpers.writeFile(absolutePath, rawContent);
      });
    //#endregion
  }
  //#endregion

  //#endregion

}
//#endregion

//#region PROJECT NAVI
/**
 * DO NOT USE environment variables in this project directly
 */
//#region @backend
@CLASS.NAME('ProjectNavi')
//#endregion
export class ProjectNavi extends Project {
  async buildLib() { }
  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    return []
    //#endregion
  }
  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backend
    throw new Error("Method not implemented.");
    //#endregion
  }
  protected startOnCommand(args: string): string {
    //#region @backendFunc
    throw new Error("Method not implemented.");
    //#endregion
  }
}
//#endregion

//#region PROJECT SCENARIO REQ RES
/**
 * DO NOT USE environment variables in this project directly
 */
//#region @backend
@CLASS.NAME('ProjectScenarioReqRes')
//#endregion
export class ProjectScenarioReqRes extends Project {
  async buildLib() { }
  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    return []
    //#endregion
  }
  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backend
    throw new Error("Method not implemented.");
    //#endregion
  }
  protected startOnCommand(args: string): string {
    //#region @backendFunc
    throw new Error("Method not implemented.");
    //#endregion
  }
}
//#endregion

//#region UNKNOW NPM PROJEC
/**
 * DO NOT USE environment variables in this project directly
 */
//#region @backend
@CLASS.NAME('ProjectUnknowNpm')
//#endregion
export class ProjectUnknowNpm extends Project {
  async buildLib() { }
  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    this.children
    return []
    //#endregion
  }
  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backend
    throw new Error("Method not implemented.");
    //#endregion
  }
  protected startOnCommand(args: string): string {
    //#region @backendFunc
    throw new Error("Method not implemented.");
    //#endregion
  }
}
//#endregion

//#region VSCODE EXT PROJECT
/**
 * DO NOT USE environment variables in this project directly
 */
//#region @backend
@CLASS.NAME('ProjectVscodeExt')
//#endregion
export class ProjectVscodeExt extends Project {
  async buildLib() { }

  recreateIfNotExists() {
    return [
      'src/config.ts',
    ]
  }
  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    return [
      '.vscode/tasks.json',
      '.vscode/launch.json',
      '.vscodeignore',
      'vsc-extension-quickstart.md',
      'tsconfig.json',
      'update-proj.js',
      ...this.projectSpecyficFilesLinked(),
      ...this.recreateIfNotExists(),
    ];
    //#endregion
  }

  projectSpecyficFilesLinked() {
    //#region @backendFunc
    let files = [
      'src/extension.ts',
      'src/helpers.ts',
      'src/helpers-vscode.ts',
      'src/models.ts',
      'src/execute-command.ts',
      'src/progress-output.ts',
    ]
    if (this.frameworkVersionAtLeast('v3')) {
      files = files.filter(f => f !== 'src/helpers-vscode.ts');
    }

    return files;
    //#endregion
  }


  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backend
    try {
      if (buildOptions.watch) {
        this.run(`npm-run tsc -p ./`).sync();
        this.run(`node update-proj.js --watch`).async();
        this.run(`npm-run tsc -watch -p ./`).async();
      } else {
        this.run(`npm-run tsc -p ./`).sync();
        this.run(`node update-proj.js`).sync();
      }
    } catch (error) {
      Helpers.error(`Not able to build extension...`, false, true);
    }
    //#endregion
  }
  protected startOnCommand(args: string): string {
    //#region @backendFunc
    throw new Error("Method not implemented.");
    //#endregion
  }
}
//#endregion
