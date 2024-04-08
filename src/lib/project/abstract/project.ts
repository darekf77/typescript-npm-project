//#region imports
import { config, extAllowedToReplace, TAGS } from 'tnp-config/src';
import { _, crossPlatformPath, path, CoreModels } from 'tnp-core/src';
import { Helpers, BaseProjectResolver, BaseProject } from 'tnp-helpers/src';
import { LibTypeArr } from 'tnp-config';
import { CoreConfig } from 'tnp-core';
import { BuildOptions, InitOptions, ReleaseOptions } from '../../build-options';
import { Models } from '../../models';
import { firedevFrameworkName, MESSAGES, morphiFrameworkName, morphiPathUserInUserDir, tmpBuildPort } from '../../constants';
//#region @backend
import { fse, json5, os } from 'tnp-core/src';
import { child_process, } from 'tnp-core/src';
import { Morphi as Firedev } from 'morphi/src';
import * as semver from 'semver';
import {
  PackageJSON, QuickFixes,
  NpmPackages, NodeModules, FilesRecreator, FilesFactory,
  FilesTemplatesBuilder,
  MochaTestRunner, JestTestRunner, CypressTestRunner,
  FilesStructure, TargetProject,
  WebpackBackendCompilation,
  LinkedRepos,
  Branding,
  DocsAppBuildConfig,
  AssetsManager,
} from '../features';
import { AssetsFileListGenerator } from '../compilers';
import { CopyManager } from '../features/copy-manager/copy-manager.backend';
import { SmartNodeModules } from '../features/smart-node-modules.backend';
import { InsideStructures } from '../features/inside-structures/inside-structures';
import { SingularBuild } from '../features/singular-build.backend';
import { argsToClear, DEFAULT_PORT, PortUtils } from '../../constants';
import { RegionRemover } from 'isomorphic-region-loader/src';
import { IncrementalBuildProcess } from '../../project/compilers/build-isomorphic-lib/compilations/incremental-build-process.backend';
import { PackagesRecognition } from '../../project/features/package-recognition/packages-recognition';
import { glob } from 'tnp-core/src';
import { LibProjectStandalone } from '../features/lib-project/lib-project-standalone.backend';
import { LibProjectSmartContainer } from '../features/lib-project/lib-project-smart-container.backend';
import { LibProjectVscodeExt } from '../features/lib-project/lib-project-vscode-ext';
import { chalk } from 'tnp-core';
import { BuildProcess, BuildProcessController } from '../features/build-process/app/build-process';
//#endregion
import { EnvironmentConfig } from '../features/environment-config/environment-config';
//#endregion


export class FiredevProjectResolve extends BaseProjectResolver<Project> {

  //#region methods / type from
  typeFrom(location: string) {
    //#region @backendFunc
    location = crossPlatformPath(location);
    if (!fse.existsSync(location)) {
      return void 0;
    }
    const packageJson = PackageJSON.fromLocation(location);
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
      resultProject = new Project(location);
    }
    if (type === 'vscode-ext') {
      resultProject = new Project(location);
    }
    if (type === 'container') {
      resultProject = new Project(location);
    }
    if (type === 'unknow-npm-project') {
      // resultProject = new (getClassFunction('ProjectUnknowNpm'))(location);
      // const ProjectUnknowNpm = require('tnp/lib/project/abstract/project').ProjectUnknowNpm;
      resultProject = new Project(location);
    }

    return resultProject as any;
    //#endregion
  }
  //#endregion

  //#region methods / nearest to
  nearestTo<T = Project>(
    absoluteLocation: string,
    options?: { type?: CoreModels.LibType; findGitRoot?: boolean; onlyOutSideNodeModules?: boolean }): T {
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

  //#region methods / tnp
  get Tnp(): Project {
    //#region @backendFunc
    let tnpPorject = this.From(config.dirnameForTnp);
    Helpers.log(`Using ${config.frameworkName} path: ${config.dirnameForTnp}`, 1)
    if (!tnpPorject && !global.globalSystemToolMode) {
      Helpers.error(`Not able to find tnp project in "${config.dirnameForTnp}".`)
    }
    return tnpPorject;
    //#endregion
  }
  //#endregion
}

export class Project extends BaseProject<Project, CoreModels.LibType>
{

  //#region static

  //#region static / instace of resolve
  static ins = new FiredevProjectResolve(Project);
  //#endregion

  private static hasResolveCoreDepsAndFolder = false;
  private static pathResolved(...partOfPath: string[]) {
    //#region @backendFunc
    // console.log('pathResolved', partOfPath);

    if (global['frameworkName'] && global['frameworkName'] === firedevFrameworkName) {
      const joined = partOfPath.join('/');
      const projectsInUserFolder = crossPlatformPath(path.join(
        crossPlatformPath(os.homedir()),
        '.firedev',
        morphiFrameworkName,
        'projects',
      ));
      let pathResult = joined.replace(
        (config.dirnameForTnp + '/' + this.firedevProjectsRelative),
        projectsInUserFolder,
      );

      pathResult = crossPlatformPath(path.resolve(pathResult));

      if (this.hasResolveCoreDepsAndFolder) {

      } else {

        const morhiVscode = path.join(path.dirname(morphiPathUserInUserDir), 'morphi/.vscode');

        if (!fse.existsSync(morphiPathUserInUserDir) && !global.skipCoreCheck) {
          if (!fse.existsSync(path.dirname(morphiPathUserInUserDir))) {
            fse.mkdirpSync(path.dirname(morphiPathUserInUserDir));
          }

          try {
            child_process.execSync(`${config.frameworkName} env:install --skipCoreCheck`, { stdio: [0, 1, 2] })
          } catch (error) {
            Helpers.error(`[${config.frameworkName}][config] Not able to install local global environment`, false, true);
          }

          try {
            child_process.execSync(`git clone ${config.urlMorphi}`, {
              cwd: path.dirname(morphiPathUserInUserDir),
              stdio: [0, 1, 2],
            });
            Helpers.remove(morhiVscode);
          } catch (error) {
            Helpers.error(`[${config.frameworkName}][config] Not able to clone repository: ${config.urlMorphi} in:
           ${morphiPathUserInUserDir}`, false, true);
          }

          try {
            child_process.execSync(`${config.frameworkName} init:core --skipCoreCheck`, {
              stdio: [0, 1, 2]
            });
          } catch (error) {
            Helpers.error(`[${config.frameworkName}][config] Not able init core project`, false, true);
          }
        }

        this.hasResolveCoreDepsAndFolder = true;
      }
      return pathResult;
    }
    return crossPlatformPath(path.resolve(path.join(...partOfPath)));
    //#endregion
  }

  private static get firedevProjectsRelative() {
    return `../morphi/projects`;
  };

  private static resolveCoreProjectsPathes(version?: CoreModels.FrameworkVersion) {
    //#region @backendFunc

    version = (!version || version === 'v1') ? '' : `-${version}` as any;
    const result = {
      container: this.pathResolved(config.dirnameForTnp, `${this.firedevProjectsRelative}/container${version}`),
      projectByType: (libType: CoreModels.NewFactoryType) => {
        if (libType === 'vscode-ext') {
          if (version === '' as any) { // TODO current version handle somehow
            version = '-' + config.defaultFrameworkVersion as any;
          }
          return this.pathResolved(config.dirnameForTnp, `${this.firedevProjectsRelative}/container${version}/${libType}${version}`);
        }
        return this.pathResolved(config.dirnameForTnp, `${this.firedevProjectsRelative}/container${version}/${libType}${version}`);
      },
      singlefileproject: this.pathResolved(config.dirnameForTnp, `${this.firedevProjectsRelative}/container${version}/single-file-project${version}`)
    };
    return result;
    //#endregion
  }

  //#region static / by
  public static by(
    libraryType: CoreModels.NewFactoryType,
    version: CoreModels.FrameworkVersion
      //#region @backend
      = config.defaultFrameworkVersion
    //#endregion
  ): Project {
    //#region @backendFunc

    if (libraryType === 'container') {
      const pathToContainer = this.resolveCoreProjectsPathes(version).container;
      const containerProject = Project.ins.From(pathToContainer);
      return containerProject as any;
    }

    if (libraryType === 'single-file-project') {
      const singleFileProject = Project.ins.From(this.resolveCoreProjectsPathes(version).singlefileproject);
      return singleFileProject as any;
    }

    const projectPath = this.resolveCoreProjectsPathes(version).projectByType(libraryType);
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

  //#region static / angular major version for current cli
  static angularMajorVersionForCurrentCli(): number {
    //#region @backendFunc
    const tnp = (Project.ins.Tnp);
    const angularFrameworkVersion = Number(_.first(tnp.version.replace('v', '').split('.')));
    return angularFrameworkVersion;
    //#endregion
  }
  //#endregion

  //#region static / morphi tag to checkout for current cli version
  static morphiTagToCheckoutForCurrentCliVersion(cwd: string): string {
    //#region @backendFunc
    const ngVer = Project.angularMajorVersionForCurrentCli();
    const lastTagForVer = (Project.ins.From(cwd) as Project).git.lastTagNameForMajorVersion(ngVer);
    return lastTagForVer;
    //#endregion
  }
  //#endregion

  //#endregion

  //#region fields
  id: number;
  readonly type: CoreModels.LibType;
  private ____projectInfoPort: number;
  private __buildOptions?: BuildOptions;
  private __forStandAloneSrc = `${config.folder.src}-for-standalone`;
  private __npmRunNg = `npm-run ng`; // when there is not globl "ng" command -> npm-run ng.js works

  //#region @backend
  public __libStandalone: LibProjectStandalone;
  public __libSmartcontainer: LibProjectSmartContainer;
  public __libVscodext: LibProjectVscodeExt;
  public __tests: MochaTestRunner;
  public __testsJest: JestTestRunner;
  public __testsCypress: CypressTestRunner;
  public __packageJson: PackageJSON;
  public __filesStructure: FilesStructure;
  public __filesTemplatesBuilder: FilesTemplatesBuilder;
  public __docsAppBuild: DocsAppBuildConfig;
  public __assetsManager: AssetsManager;
  public __targetProjects: TargetProject;
  public __branding: Branding;
  public __node_modules: NodeModules;
  public __recreate: FilesRecreator;
  public __filesFactory: FilesFactory;
  public quickFixes: QuickFixes;
  public __smartNodeModules: SmartNodeModules;
  public __assetsFileListGenerator: AssetsFileListGenerator;
  public __npmPackages: NpmPackages;
  public __env: EnvironmentConfig;
  public __copyManager: CopyManager;
  public __insideStructure: InsideStructures;
  public __singluarBuild: SingularBuild;
  public __webpackBackendBuild: WebpackBackendCompilation;
  public __linkedRepos: LinkedRepos;
  //#endregion

  //#endregion

  //#region constructor
  //#region @backend
  /**
   * DO NOT USE function isWorkspace, isWOrkspace child.. it is to expensive
   */
  constructor(location?: string) {
    super(crossPlatformPath(_.isString(location) ? location : ''));
    if (!global.codePurposeBrowser) { // TODO when on weird on node 12

      this.__packageJson = PackageJSON.fromProject(this);
      this.setType(this.__packageJson ? this.__packageJson.type : 'unknow');

      this.defineProperty<Project>('quickFixes', QuickFixes);
      this.defineProperty<Project>('__node_modules', NodeModules);
      this.defineProperty<Project>('__npmPackages', NpmPackages);
      this.defineProperty<Project>('__recreate', FilesRecreator);
      this.defineProperty<Project>('__filesFactory', FilesFactory);
      this.defineProperty<Project>('__filesTemplatesBuilder', FilesTemplatesBuilder);
      // console.log({
      //   MochaTestRunner, JestTestRunner, CypressTestRunner,
      // })
      this.defineProperty<Project>('__tests', MochaTestRunner);
      this.defineProperty<Project>('__testsJest', JestTestRunner);
      this.defineProperty<Project>('__testsCypress', CypressTestRunner);
      Project.ins.add(this);
      this.defineProperty<Project>('__env', EnvironmentConfig);
      this.defineProperty<Project>('__copyManager', CopyManager, {
        customInstanceReturn: () => CopyManager.for(this)
      });
      this.defineProperty<Project>('__filesStructure', FilesStructure);
      this.defineProperty<Project>('__targetProjects', TargetProject);
      this.defineProperty<Project>('__smartNodeModules', SmartNodeModules);
      this.defineProperty<Project>('__insideStructure', InsideStructures);
      this.defineProperty<Project>('__singluarBuild', SingularBuild);
      this.defineProperty<Project>('__webpackBackendBuild', WebpackBackendCompilation);
      this.defineProperty<Project>('__linkedRepos', LinkedRepos);
      this.defineProperty<Project>('__branding', Branding);
      this.defineProperty<Project>('__docsAppBuild', DocsAppBuildConfig);
      this.defineProperty<Project>('__assetsManager', AssetsManager);
      this.defineProperty<Project>('__assetsFileListGenerator', AssetsFileListGenerator);
      this.defineProperty<Project>('__libStandalone', LibProjectStandalone);
      this.defineProperty<Project>('__libSmartcontainer', LibProjectSmartContainer);
      this.defineProperty<Project>('__libVscodext', LibProjectVscodeExt);
    }

  }
  //#endregion
  //#endregion

  //#region getters & methods

  //#region getters & methods / set project info port
  __setProjectInfoPort(v) {
    //#region @backend
    this.____projectInfoPort = v;
    const children = this.children.filter(f => f.location !== this.location);
    for (const child of children) {
      child.__setProjectInfoPort(v);
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / ins
  /**
   * @overload
   */
  public get ins(): FiredevProjectResolve {
    return Project.ins;
  };
  //#endregion

  //#region getters & methods / children
  /**
   * @overload
   */
  get children(): Project[] {
    //#region @backendFunc
    if (this.pathExists('taon.json')) {
      const taonChildren = Helpers.foldersFrom(this.location)
        .filter(f => !f.startsWith('.') && ![
          config.folder.node_modules,
        ].includes(path.basename(f)))
        .map(f => Project.ins.From(f) as Project)
        .filter(f => !!f);
      // console.log({
      //   taonChildren: taonChildren.map(c => c.location)
      // })
      return taonChildren;
    }

    if (this.__isTnp && !global.globalSystemToolMode) {
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
  //#endregion

  //#region getters & methods / is using action commit
  /**
   * @overload
   */
  isUnsingActionCommit() {
    return true;
  }
  //#endregion

  //#region getters & methods / lint
  async lint(lintOptions?: any) {
    // TODO
  }
  //#endregion

  installNpmPackages() {
    //#region @backendFunc
    this.__npmPackages.installFromArgs('');
    //#endregion
  }

  useGitBranchesAsMetadataForCommits() {
    return false;
  }

  automaticallyAddAllChnagesWhenPushingToGit() {
    return this.__isContainer || this.__isStandaloneProject || this?.parent?.__isContainer;
  }

  //#region getters & methods / use git branches when commting and pushing
  useGitBranchesWhenCommitingAndPushing() {
    return false;
  }
  //#endregion

  //#region getters & methods / set project info
  get __projectInfoPort() {
    //#region @backendFunc
    let port = this.____projectInfoPort;
    if (!port && this.__isSmartContainerTarget) {
      return this.__smartContainerTargetParentContainer?.__projectInfoPort;
    }
    return port;
    //#endregion
  }
  //#endregion

  //#region getters & methods / get standalone normal app port
  get __standaloneNormalAppPort() {
    //#region @backendFunc
    return PortUtils.instance(this.__projectInfoPort).calculateClientPortFor(this, { websql: false })
    //#endregion
  }
  //#endregion

  //#region getters & methods / get standalone websql app port
  get __standaloneWebsqlAppPort() {
    //#region @backendFunc
    return PortUtils.instance(this.__projectInfoPort).calculateClientPortFor(this, { websql: true })
    //#endregion
  }
  //#endregion

  //#region  methods & getters / get default develop Branch
  getDefaultDevelopmentBranch() {
    return 'master';
  }
  //#endregion

  //#region getters & methods / link project exited
  get __linkedProjectsExisted(): Project[] {
    //#region @backendFunc
    return this.__packageJson.linkedProjects
      .filter(f => !Helpers.isValidGitRepuUrl(f))
      .sort()
      .map(f => {
        const p = path.join(this.location, f);
        const proj = Project.ins.From(p);
        return proj;
      })
      .filter(f => !!f);
    //#endregion
  }
  //#endregion

  //#region getters & methods / smart container build target
  get __smartContainerBuildTarget(): Project {
    //#region @backendFunc
    if (this.__isSmartContainerChild) {
      return this.parent.__smartContainerBuildTarget;
    }

    if (this.__isSmartContainerTarget) {
      return this.__smartContainerTargetParentContainer.__smartContainerBuildTarget;
    }

    if (!this.__packageJson.smartContainerBuildTarget) {
      if (this.children.length === 1) {
        this.__packageJson.data.tnp.smartContainerBuildTarget = _.first(this.children).name;
      } else {
        if (this.__isSmartContainerChild || this.__isSmartContainer) {
          //#region display update messge for container build
          Helpers.logError(`

 Please specify in your configuration proper ${chalk.bold('smartContainerBuildTarget')}:

 file: ${config.file.package_json__tnp_json5}

   ...
     smartContainerBuildTarget: <name of main project>
   ...



       `, false, false);

          Helpers.log(`[singularbuildcontainer] children for build: \n\n${this.children.map(c => c.name)}\n\n`);
          //#endregion

        }
      }
    }

    const children = this.children;
    let target = children
      .filter(c => c.typeIs('isomorphic-lib'))
      .find(c => c.name === this.__packageJson.smartContainerBuildTarget);

    if (!target && children.length === 1) {
      target = _.first(children);
    }

    return target;
    //#endregion
  }
  //#endregion

  //#region getters & methods / children that are libs
  get __childrenThatAreLibs(): Project[] {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return [];
    }
    return this.children.filter(c => {
      return c.typeIs(...([
        'isomorphic-lib'
      ] as CoreModels.LibType[]));
    });
    //#endregion
  }
  //#endregion

  //#region getters & methods / add sources from core
  __addSourcesFromCore() {
    //#region @backend
    const corePath = Project.by(this.type, this.__frameworkVersion).location

    const srcInCore = path.join(corePath, config.folder.src);
    const srcForStandAloenInCore = path.join(corePath, this.__forStandAloneSrc);

    const dest = path.join(this.location, config.folder.src);
    const destForStandalone = path.join(this.location, this.__forStandAloneSrc);

    if (Helpers.exists(srcInCore)) {
      Helpers.copy(srcInCore, dest, { recursive: true, overwrite: true });
    }

    if (Helpers.exists(srcForStandAloenInCore)) {
      Helpers.copy(srcForStandAloenInCore, destForStandalone, { recursive: true, overwrite: true });
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / replace source for standalone
  __replaceSourceForStandalone() {
    //#region @backend
    const folderName = config.folder.src;
    const orgSource = path.join(this.location, folderName);
    Helpers.removeFolderIfExists(orgSource);
    const standalone = path.join(this.location, this.__forStandAloneSrc);
    if (Helpers.exists(standalone)) {
      Helpers.move(standalone, orgSource)
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / remove source for standalone
  __removeStandaloneSources() {
    //#region @backend
    const standalone = path.join(this.location, this.__forStandAloneSrc);
    Helpers.removeFolderIfExists(standalone);
    //#endregion
  }
  //#endregion

  //#region getters & methods / clear Process

  //#endregion

  //#region getters & methods / clear
  public async clear(options: { recrusive?: boolean, resetOnly?: boolean; } = {}) {
    //#region @backend
    Helpers.removeIfExists(path.join(this.location, config.file.tnpEnvironment_json));
    const { recrusive, resetOnly } = options || {};
    if (this.typeIs('unknow')) {
      return;
    }
    Helpers.info(`Cleaning project: ${this.genericName}`);
    if (!resetOnly) {
      this.__node_modules.remove();
      while (true) {
        try {
          this.__node_modules.remove();
          this.__smartNodeModules.remove();
          break;
        } catch (error) {
          Helpers.pressKeyAndContinue(MESSAGES.SHUT_DOWN_FOLDERS_AND_DEBUGGERS)
        }
      }

    }

    Helpers.remove(crossPlatformPath([this.location, 'tmp-*']));
    this.quickFixes.removeUncessesaryFiles();

    glob.sync(`${this.location}/*.filetemplate`).forEach(fileTemplate => {
      Helpers.remove(fileTemplate);
      Helpers.remove(fileTemplate.replace('.filetemplate', ''));
    });

    if (this.typeIs('unknow')) {
      return;
    }

    this.__removeRecognizedIsomorphicLIbs();
    let gitginoredfiles = this.__recreate.filesIgnoredBy.gitignore
      .map(f => f.startsWith('/') ? f.substr(1) : f)
      .filter(f => {
        if (f.startsWith('tsconfig.') && this.__isTnp) {
          return false;
        }
        if (f === config.folder.node_modules) {
          return false;
        }
        if (config.filesNotAllowedToClean.includes(f)) {
          return false;
        }
        return true;
      })

    if (this.__isCoreProject) {
      gitginoredfiles = gitginoredfiles.filter(f => {
        return [
          config.folder.node_modules
        ].map(c => `/${c}`).includes(f);
      })
    }

    for (let index = 0; index < gitginoredfiles.length; index++) {
      const head = gitginoredfiles[index].trim();
      const fileOrDirPath = path.join(this.location, head);
      if (!head.startsWith('**')) {
        Helpers.log(`Removing: "${head}"`)
        if (process.platform === 'win32') {
          while (true) {
            try {
              Helpers.remove(fileOrDirPath);
              break;
            } catch (error) {
              // TODO last notification to user
              Helpers.pressKeyAndContinue(MESSAGES.SHUT_DOWN_FOLDERS_AND_DEBUGGERS)
            }
          }
        } else {
          Helpers.remove(fileOrDirPath)
        }

      }
    }

    Helpers.remove(`${this.location}/tmp*`);
    Helpers.remove(`${this.location}/browser-*`);
    Helpers.remove(`${this.location}/dist`);

    this.__clearNodeModulesFromLinks();
    this.quickFixes.missingSourceFolders()
    if (recrusive) {
      for (const child of this.children) {
        await child.clear(options);
      }
      return;
    }
    const children = this.children.filter(c => (c.typeIs('isomorphic-lib') || c.__isSmartContainer)
      && c.__frameworkVersionAtLeast('v3') && c.__npmPackages.useSmartInstall);
    for (let index = 0; index < children.length; index++) {
      const c = children[index];
      await c.clear(options);
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / clear node modules from links
  /**
   * @deprecated
   */
  private __clearNodeModulesFromLinks() {
    //#region @backend
    if (!this.__isStandaloneProject) {
      return;
    }
    Helpers.log(`Reseting symbolic links from node_mouels..start..`);
    const node_modules = path.join(this.location, config.folder.node_modules);
    const folders = !fse.existsSync(node_modules) ? [] : fse.readdirSync(node_modules);
    folders
      .map(f => path.join(node_modules, f))
      .filter(f => fse.lstatSync(f).isSymbolicLink())
      .forEach(f => {
        Helpers.log(`Deleting link  node_modules / ${path.basename(f)}`);
        Helpers.remove(f);
      });
    Helpers.log(`Reseting symbolic links from node_mouels..DONE`);
    //#endregion
  }
  //#endregion

  //#region getters & methods / remove recognized isomorhic libs
  private __removeRecognizedIsomorphicLIbs() {
    //#region @backend
    if (this.typeIs('unknow')) {
      return;
    }
    try {
      const pjPath = path.join(this.location, config.file.package_json);
      const pj: Models.IPackageJSON = fse.readJsonSync(pjPath, {
        encoding: 'utf8'
      });
      pj[config.array.isomorphicPackages] = void 0;
      fse.writeJsonSync(pjPath, pj, {
        encoding: 'utf8',
        spaces: 2
      });
    } catch (e) { }
    //#endregion
  }
  //#endregion

  //#region getters & methods / get string npm package name
  public get __npmPackageName(): string {
    //#region @backendFunc
    if (this.__isSmartContainerChild) {
      return `@${this.parent.name}/${this.name}`;
    }
    return `${this.name}`;
    //#endregion
  }
  //#endregion

  //#region getters & methods / get string npm packge name and version
  public get __npmPackageNameAndVersion(): string {
    //#region @backendFunc
    return `${this.__npmPackageName}@${this.version}`;
    //#endregion
  }
  //#endregion

  //#region getters & methods / generic name
  /**
   * @overload
   */
  public get genericName(): string {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return;
    }
    if (!_.isNil(this.cache['genericName'])) {
      this.cache['genericName'];
    }

    let result = [];
    if (this.__isSmartContainerTarget) {
      // result = [
      //   this.smartContainerTargetParentContainer.name,
      //   this.name,
      // ]
      result = result.concat(this.__smartContainerTargetParentContainer.parentsNames);
    } else {
      result = result.concat(this.parentsNames);
    }

    if (this.__isSmartContainerTarget) {
      result.push(this.__smartContainerTargetParentContainer.name);
    }
    result.push(this.name);
    const res = result.filter(f => !!f).join('/').trim()
    if (_.isNil(this.cache['genericName'])) {
      this.cache['genericName'] = res;
    }
    return this.cache['genericName'];
    //#endregion
  }
  //#endregion

  //#region getters & methods / name
  /**
   * @overload
   */
  public get name(): string {
    //#region @backendFunc
    if (this.__packageJson && this.typeIs('unknow-npm-project')) {
      if (this.__packageJson.name !== path.basename(this.location)
        && path.basename(path.dirname(this.location)) === 'external') {
        return path.basename(this.location);
      }
    }
    return this.__packageJson ? this.__packageJson.name : path.basename(this.location);
    //#endregion
  }
  //#endregion

  //#region getters & methods / version
  /**
   * Version from package.json
   * @overload
   */
  get version() {
    //#region @backendFunc
    return this.__packageJson?.version;
    //#endregion
  }
  //#endregion

  //#region getters & methods / is smart container target
  get __isSmartContainerTarget() {
    //#region @backendFunc
    const folderBefore = path.basename(path.dirname(path.dirname(this.location)));
    return [config.folder.dist].includes(folderBefore)
      && this.__smartContainerTargetParentContainer?.__isSmartContainer;
    //#endregion
  }
  //#endregion

  //#region getters & methods / is smart container non client target
  /**
   * other projects beside smart container target
   */
  get __isSmartContainerTargetNonClient() {
    //#region @backendFunc
    const parent = this.__smartContainerTargetParentContainer;
    return !!(parent?.__isSmartContainer && parent.__smartContainerBuildTarget?.name !== this.name);
    //#endregion
  }
  //#endregion

  //#region getters & methods / get smart container target partent
  get __smartContainerTargetParentContainer() {
    //#region @backendFunc
    return Project.ins.From(path.dirname(path.dirname(path.dirname(this.location)))) as Project;
    //#endregion
  }
  //#endregion

  //#region getters & methods / is smart container
  get __isSmartContainer() {
    //#region @backendFunc
    return this.__frameworkVersionAtLeast('v3')
      && this.__packageJson.isSmart
      && this.__isContainer
      && !this.__isContainerCoreProject
      && !this.__isContainerCoreProjectTempProj;
    //#endregion
  }
  //#endregion

  //#region getters & methods / is smart container child
  get __isSmartContainerChild() {
    //#region @backendFunc
    return !!this.parent?.__isSmartContainer;
    //#endregion
  }
  //#endregion

  //#region getters & methods / is isomorphic lib
  get __isIsomorphicLib() {
    //#region @backendFunc
    return this.typeIs('isomorphic-lib');
    //#endregion
  }
  //#endregion

  //#region getters & methods / is container or workspace with linked projects
  get __isContainerWithLinkedProjects() {
    //#region @backendFunc
    return this.__isContainer && this.__packageJson.linkedProjects.length > 0;
    //#endregion
  }
  //#endregion

  //#region getters & methods / is vscode extension
  get __isVscodeExtension() {
    //#region @backendFunc
    return this.typeIs('vscode-ext');
    //#endregion
  }
  //#endregion

  //#region getters & methods / is docker project
  /**
   * @deprecated
   */
  get __isDocker() {
    //#region @backendFunc
    return this.typeIs('docker');
    //#endregion
  }
  //#endregion

  //#region getters & methods / is container
  /**
   * is normal or smart containter
   */
  get __isContainer() { // TOOD @LAST
    //#region @backendFunc
    return this.typeIs('container');
    //#endregion
  }
  //#endregion

  //#region getters & methods / is container core project
  get __isContainerCoreProject() {
    //#region @backendFunc
    return this.__isContainer && this.__isCoreProject;
    //#endregion
  }
  //#endregion

  //#region getters & methods / is temp container core project
  get __isContainerCoreProjectTempProj() {
    //#region @backendFunc
    const dirpar = path.dirname(path.dirname(this.location));
    const isTemp = path.basename(dirpar) === 'tmp-smart-node_modules'; // TODO QUICK_FIX
    return this.__isContainerCoreProject && isTemp;
    //#endregion
  }
  //#endregion

  //#region getters & methods / is container child
  get __isContainerChild() {
    //#region @backendFunc
    return !!this.parent && this.parent.typeIs('container');
    //#endregion
  }
  //#endregion

  //#region getters & methods / all resources
  private get __allResources() {
    //#region @backendFunc
    const resurces = [
      config.file.package_json,
      'tsconfig.json',
      'tsconfig.browser.json',
      'tsconfig.isomorphic.json',
      'tsconfig.isomorphic-flat-dist.json',
      config.file._npmrc,
      config.file._npmignore,
      config.file._gitignore,
      config.file.environment_js,
      config.file.tnpEnvironment_json,
      config.folder.bin,
      config.folder._vscode,
      ...this.__resources
    ];
    return resurces;
    //#endregion
  }
  //#endregion

  //#region getters & methods / is standalone project
  /**
   * Standalone project ready for publish on npm
   * Types of standalone project:
   * - isomorphic-lib : backend/fronded ts library with server,app preview
   * - angular-lib: frontend ui lib with angular preview
   */
  get __isStandaloneProject() {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return false;
    }
    return (!this.__isContainer
      && !this.isUnknowNpmProject
      && !this.__isDocker
    );
    //#endregion
  }
  //#endregion

  //#region getters & methods / is monorepo
  get __isMonorepo() {
    //#region @backendFunc
    return this.__packageJson.isMonorepo;
    //#endregion
  }
  //#endregion

  //#region getters & methods / is tnp
  /**
   * TODO make this more robust
   */
  get __isTnp() {
    //#region @backendFunc
    if (this.typeIsNot('isomorphic-lib')) {
      return false;
    }
    return this.location === Project.ins.Tnp.location;
    //#endregion
  }
  //#endregion

  //#region getters & methods / linked folders
  get __linkedFolders() {
    //#region @backendFunc
    return this.__packageJson.linkedFolders;
    //#endregion
  }
  //#endregion

  //#region getters & methods / is core project
  /**
   * Core project with basic tested functionality
   */
  get __isCoreProject() {
    //#region @backendFunc
    return this.__packageJson && this.__packageJson.isCoreProject;
    //#endregion
  }
  //#endregion

  //#region getters & methods / files templates
  /**
   * Generated automaticly file templates exmpale:
   * file.ts.filetemplate -> will generate file.ts
   * inside triple bracked: {{{  ENV. }}}
   * property ENV can be used to check files
   */
  public __filesTemplates(): string[] {
    //#region @backendFunc
    // TODO should be abstract
    let templates = [];

    if (this.__isSmartContainer) {
      templates = [
        'tsconfig.json.filetemplate',
        ...templates,
      ]
    }

    if (this.typeIs('isomorphic-lib')) {
      templates = [
        'tsconfig.json.filetemplate',
        'tsconfig.backend.dist.json.filetemplate',
      ];

      if (this.__frameworkVersionAtLeast('v2')) {
        templates = [
          'tsconfig.isomorphic.json.filetemplate',
          'tsconfig.isomorphic-flat-dist.json.filetemplate',
          'tsconfig.browser.json.filetemplate',
          ...this.__vscodeFileTemplates,
          ...templates,
        ];
      }

      if (this.__frameworkVersionAtLeast('v3')) {
        templates = templates.filter(f => !this.__ignoreInV3.includes(f))
      }
    }

    return templates;
    //#endregion
  }
  //#endregion

  //#region getters & methods / project specify files
  __projectSpecyficFiles() {
    //#region @backendFunc
    let files = [
      'index.js',
      'index.d.ts',
      'index.js.map',
    ];

    if (this.__isSmartContainer) {
      return [
        ...this.__filesTemplates(),
        // 'tsconfig.json',
        // ...this.vscodeFileTemplates,
      ]
    }

    if (this.__isVscodeExtension) {
      return [
        '.vscode/tasks.json',
        '.vscode/launch.json',
        '.vscodeignore',
        'vsc-extension-quickstart.md',
        'tsconfig.json',
        'update-proj.js',
        ...this.__projectSpecyficFilesLinked(),
        ...this.__recreateIfNotExists(),
      ];
    }

    if (this.typeIs('isomorphic-lib')) {
      files = files
        .concat([
          'tsconfig.browser.json',
          'webpack.config.js',
          'webpack.backend-dist-build.js',
          'run.js',
          'run-org.js',
          ...this.__filesTemplates(),
        ]).concat(
          !this.__isStandaloneProject ? [
            'src/typings.d.ts',
          ] : []);

      if (this.__frameworkVersionAtLeast('v2')) {
        files = files.filter(f => f !== 'tsconfig.browser.json');
      }

      if (this.__frameworkVersionAtLeast('v3')) {
        files = files.filter(f => !this.__ignoreInV3.includes(f));
      }
    }

    return files;
    //#endregion
  }
  //#endregion

  //#region getters & methods / project source files
  /**
   * TODO
   */
  public __projectSourceFiles(): string[] {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return [];
    }
    // TODO should be abstract
    return [
      ...this.__filesTemplates(),
      ...(this.__filesTemplates().map(f => f.replace(`.${config.filesExtensions.filetemplate}`, ''))),
      ...(this.__projectSpecyficFiles())
    ];
    //#endregion
  }
  //#endregion

  //#region getters & methods / get isomorphic packages
  /**
   * array of isomorphic pacakges
   * example:
   * ['firedev', '@something/child', 'morphi' ]
   */
  public get __isomorphicPackages(): string[] {
    //#region @backendFunc
    const isomorphicPackagesArr = [];

    if (this.typeIs('unknow')) {
      return isomorphicPackagesArr;
    }
    try {
      let location = this.location;
      if (this.__isContainerCoreProject) {
        location = path.dirname(this.__smartNodeModules.path);
      }
      if (this.__isContainerCoreProjectTempProj) {
        const origin = Project.ins.From(path.dirname(path.dirname(path.dirname(this.location)))) as Project;
        location = path.dirname(origin.__smartNodeModules.path);
      }

      var p = crossPlatformPath(path.join(location, config.tempFiles.FILE_NAME_ISOMORPHIC_PACKAGES))
      if (!fse.existsSync(p)) {
        PackagesRecognition.fromProject(this as any).start(void 0, '[firedev-projct][getter isomorphic pacakges ]');
      }
      const f = Helpers.readJson(p);
      const arr = f[config.array.isomorphicPackages];
      if (_.isArray(arr)) {
        return isomorphicPackagesArr.concat(arr);
      } else {
        return isomorphicPackagesArr;
      }
      // warn(`Isomorphic package file does not exists : ${p}`);
    } catch (e) {
      if (global.globalSystemToolMode) {
        Helpers.log(e);
        Helpers.error(`Erro while reading ismorphic package file: ${p}`, true, true);
      }
      return isomorphicPackagesArr;
    };
    //#endregion
  }
  //#endregion

  //#region getters & methods / get framework version
  public get __frameworkVersion() {
    //#region @backendFunc
    return this.__packageJson.frameworkVersion;
    //#endregion
  }
  //#endregion

  //#region getters & methods / get framework version minus 1
  public get __frameworkVersionMinusOne(): CoreModels.FrameworkVersion {
    //#region @backendFunc
    const curr = Number(_.isString(this.__frameworkVersion) && this.__frameworkVersion.replace('v', ''))
    if (!isNaN(curr) && curr >= 2) {
      return `v${curr - 1}` as CoreModels.FrameworkVersion;
    };
    return 'v1';
    //#endregion
  }
  //#endregion

  //#region getters & methods / framwrok version equals
  public __frameworkVersionEquals(version: CoreModels.FrameworkVersion) {
    //#region @backendFunc
    const ver = Number(_.isString(version) && version.replace('v', ''));
    const curr = Number(_.isString(this.__frameworkVersion) && this.__frameworkVersion.replace('v', ''))
    return !isNaN(ver) && !isNaN(curr) && (curr === ver);
    //#endregion
  }
  //#endregion

  //#region getters & methods / framework version at least
  public __frameworkVersionAtLeast(version: CoreModels.FrameworkVersion) {
    //#region @backendFunc
    const ver = Number(_.isString(version) && version.replace('v', ''));
    const curr = Number(_.isString(this.__frameworkVersion) && this.__frameworkVersion.replace('v', ''))
    return !isNaN(ver) && !isNaN(curr) && (curr >= ver);
    //#endregion
  }
  //#endregion

  //#region getters & methods / framework version less than
  public __frameworkVersionLessThan(version: CoreModels.FrameworkVersion) {
    //#region @backendFunc
    const ver = Number(_.isString(version) && version.replace('v', ''));
    const curr = Number(_.isString(this.__frameworkVersion) && this.__frameworkVersion.replace('v', ''))
    return !isNaN(ver) && !isNaN(curr) && (curr < ver);
    //#endregion
  }
  //#endregion

  //#region getters & methods / is in release dist
  public get isInCiReleaseProject() {
    //#region @backendFunc
    return this.location.includes(crossPlatformPath([config.folder.tmpDistRelease, config.folder.dist, 'project']));
    //#endregion
  };
  //#endregion

  //#region getters & methods / release
  public async release(releaseOptions: ReleaseOptions) {
    //#region @backendFunc

    //#region prepare params
    if (releaseOptions.automaticRelease) {
      global.tnpNonInteractive = true;
    }
    if (this.__packageJson.libReleaseOptions.cliBuildObscure) {
      releaseOptions.cliBuildObscure = true;
    }
    if (this.__packageJson.libReleaseOptions.cliBuildUglify) {
      releaseOptions.cliBuildUglify = true;
    }
    if (this.__packageJson.libReleaseOptions.cliBuildNoDts) {
      releaseOptions.cliBuildNoDts = true;
    }
    if (this.__packageJson.libReleaseOptions.cliBuildIncludeNodeModules) {
      releaseOptions.cliBuildIncludeNodeModules = true;
    }

    const automaticReleaseDocs = !!releaseOptions.automaticReleaseDocs;
    if (automaticReleaseDocs) {
      global.tnpNonInteractive = true;
    }

    if (!releaseOptions.automaticRelease && automaticReleaseDocs && !this.__docsAppBuild.configExists) {
      Helpers.error(`To use command:  ${config.frameworkName} automatic:release:docs
    you have to build manulally your app first....

    Try:
    ${config.frameworkName} relase # by building docs app, you will save configuration for automatic build



    `, false, true)
    }

    if (this.__isSmartContainerChild) {
      Helpers.error(`Smart container not supported yet...`, false, true);
    }


    // if (!global.tnpNonInteractive) {
    //   Helpers.clearConsole();
    // }
    //#endregion

    //#region resolve ishould release library
    if (releaseOptions.shouldReleaseLibrary) {
      if (releaseOptions.releaseType === 'major') {
        const newVersion = this.__versionMajorPlusWithZeros;
        this.__packageJson.data.version = newVersion;
        this.__packageJson.save(`${releaseOptions.releaseType} version up`);
      } else if (releaseOptions.releaseType === 'minor') {
        const newVersion = this.__versionMinorPlusWithZeros;
        this.__packageJson.data.version = newVersion;
        this.__packageJson.save(`${releaseOptions.releaseType} version up`);
      } else if (releaseOptions.releaseType === 'patch') {
        const newVersion = this.__versionPatchedPlusOne;
        this.__packageJson.data.version = newVersion;
        this.__packageJson.save(`${releaseOptions.releaseType} version up`);
      }
    }
    //#endregion

    this.__packageJson.showDeps('Release');

    if (this.__isContainer && !this.__isSmartContainer) {
      //#region container release

      //#region resolve deps
      releaseOptions.resolved = releaseOptions.resolved.filter(f => f.location !== this.location);



      const depsOnlyToPush = [];
      //#endregion

      //#region filter children
      for (let index = 0; index < releaseOptions.resolved.length; index++) {
        const child = releaseOptions.resolved[index];


        const lastBuildHash = child.__packageJson.getBuildHash();
        const lastTagHash = child.git.lastTagHash();
        const versionIsOk = !!releaseOptions.specifiedVersion
          ? child.__frameworkVersionAtLeast(releaseOptions.specifiedVersion as any) : true;

        const shouldRelease = (
          (!child.__isSmartContainerChild)
          && versionIsOk
          && !child.__shouldBeOmmitedInRelease
          && !child.__targetProjects?.exists
        );
        Helpers.log(`ACTUALL RELEASE ${child.name}: ${shouldRelease}
      lastBuildHash: ${lastBuildHash}
      lastTagHash: ${lastTagHash}
      isPrivate: ${child.__packageJson.isPrivate}
      versionIsOk: ${versionIsOk}
      `)

        if (!shouldRelease) {

          // child.git.addAndCommit();
          // await child.git.pushCurrentBranch();

          depsOnlyToPush.push(child);
          releaseOptions.resolved[index] = void 0;
        }
      }
      releaseOptions.resolved = releaseOptions.resolved.filter(f => !!f).map(c => Project.ins.From(c.location));
      //#endregion

      //#region projs tempalte
      const projsTemplate = (child?: Project) => {
        return `

    PROJECTS FOR RELEASE: ${releaseOptions.specifiedVersion
            ? ('(only framework version = ' + releaseOptions.specifiedVersion + ' )') : ''}

${releaseOptions.resolved.filter(p => {
              if (releaseOptions.resolved.length > 0) {
                return releaseOptions.resolved.includes(p)
              }
              return true;
            })
            .map((p, i) => {
              const bold = (child?.name === p.name);
              const index = i + 1;
              return `(${bold ? chalk.underline(chalk.bold(index.toString())) : index}. ${bold ? chalk.underline(chalk.bold(p.name)) : p.name})`;
            }).join(', ')}


${Helpers.terminalLine()}
processing...
    `;
      };
      //#endregion

      //#region release loop


      for (let index = 0; index < releaseOptions.resolved.length; index++) {

        const child = releaseOptions.resolved[index] as Project;
        console.log({ child })

        if (index === 0) {
          global.tnpNonInteractive = (releaseOptions.resolved.length === 0);
          // Helpers.info(`
          // to relase
          // ${depsOfResolved.map((d, i) => i + '.' + d.name).join('\n')}
          // `)

        }

        const exitBecouseNotInResolved = (
          releaseOptions.resolved.length > 0
          && _.isUndefined(releaseOptions.resolved.find(c => c.location === child.location))
        );

        if (exitBecouseNotInResolved) {
          continue;
        }

        Helpers.clearConsole();
        Helpers.info(projsTemplate(child));

        await child.release(releaseOptions.clone({
          resolved: [],
          skipProjectProcess: releaseOptions.skipProjectProcess,
        }));


      }
      //#endregion

      Helpers.clearConsole();
      Helpers.info(projsTemplate());

      //#region display end message
      if (releaseOptions.resolved.length === 0) {
        for (let index = 0; index < depsOnlyToPush.length; index++) {
          const depForPush = depsOnlyToPush[index] as Project;

          Helpers.warn(`

        No realase needed for ${chalk.bold(depForPush.name)} ..just initing and pushing to git...

        `); // hash in package.json to check

          if (depForPush.typeIs('isomorphic-lib') && depForPush.__isSmartContainer) {
            try {
              await depForPush.init(InitOptions.from({}))
            } catch (error) {
              console.error(error)
              Helpers.info(`Not able to init fully...`);
            }
          }

          depForPush.git.stageAllAndCommit(`release push`);
          await depForPush.git.pushCurrentBranch()
        }

        this.git.stageAllAndCommit(`Update after release`);
        await this.git.pushCurrentBranch();
        const tnpProj = (Project.ins.Tnp);
        tnpProj.git.stageAllAndCommit(`Update after release`);
        await tnpProj.git.pushCurrentBranch();
        Helpers.success(`


      R E L E A S E   O F   C O N T I A I N E R  ${chalk.bold(this.genericName)}  D O N E


      `);
      } else {
        Helpers.success(`


      P A R T I A L  R E L E A S E   O F   C O N T I A I N E R  ${chalk.bold(this.genericName)}  D O N E


      `);
      }
      //#endregion

      //#endregion
    } else {
      //#region standalone project release
      if (this.__targetProjects.exists) {
        await this.__targetProjects.update();
      } else {
        if (!this.__node_modules.exist) {
          this.__npmPackages.installFromArgs('');
        }

        const tryReleaseProject = async () => {
          while (true) {
            try {
              if (this.__npmPackages.useSmartInstall) {
                this.__node_modules.remove();
                this.__smartNodeModules.install('install');
              }
              await this.init(); // TODO not needed build includes init
              break;
            } catch (error) {
              console.error(error)
              if (!(await Helpers.consoleGui.question.yesNo(`Not able to INIT your project ${chalk.bold(this.genericName)} try again..`))) {
                releaseOptions?.finishCallback()
              }
            }
          }
        };

        while (true) {
          await tryReleaseProject();
          try {
            await this.__release(releaseOptions);
            break;
          } catch (error) {
            Helpers.error(`Not able to RELEASE your project ${chalk.bold(this.genericName)}`, true, true);
            if (!(await Helpers.questionYesNo(`Try again ? (or exit proces)`, void 0, void 0, true, true))) {
              process.exit(0)
            }
          }
        }
      }
      //#endregion
    }
    //#endregion
  }

  public async __release(releaseOptions?: ReleaseOptions) {
    //#region @backendFunc
    const { prod = false, shouldReleaseLibrary, automaticReleaseDocs, automaticRelease } = releaseOptions;

    if (!this.isInCiReleaseProject) {
      const tempGeneratedCiReleaseProject = await this.__createTempCiReleaseProject();
      await tempGeneratedCiReleaseProject.__release(releaseOptions);
      return;
    }

    Helpers.log(`automaticRelease=${automaticRelease}`);
    Helpers.log(`global.tnpNonInteractive=${global.tnpNonInteractive}`);

    const realCurrentProj = this.__releaseCiProjectParent;

    let specyficProjectForBuild: Project;

    if (shouldReleaseLibrary && !automaticReleaseDocs) {
      //#region publish lib process
      var newVersion = realCurrentProj.version;

      this.checkIfLogginInToNpm();
      this.__checkIfReadyForNpm();

      if (this.__isStandaloneProject) {
        await this.__libStandalone.bumpVersionInOtherProjects(newVersion, true)
      }

      this.__commitRelease(newVersion);

      this.__packageJson.data.version = newVersion;
      this.__packageJson.save('show for release')

      specyficProjectForBuild = await this.__releaseBuildProcess({
        realCurrentProj, releaseOptions, cutNpmPublishLibReleaseCode: true
      });

      if (this.__isSmartContainer) {
        specyficProjectForBuild.__libSmartcontainer.preparePackage(this, newVersion);
      }

      if (this.__isStandaloneProject) {
        specyficProjectForBuild.__libStandalone.preparePackage(this, newVersion);
      }

      if (this.__isStandaloneProject) {
        this.__libStandalone.fixPackageJson(realCurrentProj)
      }

      if (this.__isStandaloneProject) {
        realCurrentProj.quickFixes.updateStanaloneProjectBeforePublishing(
          this,
          realCurrentProj,
          specyficProjectForBuild,
        );
      } else {
        realCurrentProj.quickFixes.updateContainerProjectBeforePublishing(
          this,
          realCurrentProj,
          specyficProjectForBuild,
        );
      }

      let publish = true;

      if (!global.tnpNonInteractive) {
        await Helpers.questionYesNo(`Do you wanna check compiled version before publishing ?`, async () => {
          specyficProjectForBuild.run(`code ${this.__getTempProjName('dist')}/${config.folder.node_modules}`).sync();
          Helpers.pressKeyAndContinue(`Check your compiled code and press any key ...`)
        });
      }

      publish = await Helpers.questionYesNo(`Publish this package ?`);

      if (publish) {
        if (this.__isSmartContainer) {
          await specyficProjectForBuild.__libSmartcontainer.publish({
            realCurrentProj,
            rootPackageName: `@${this.name}`,
            newVersion,
            automaticRelease,
            prod,
          })
        }

        if (this.__isStandaloneProject) {
          await specyficProjectForBuild.__libStandalone.publish({
            realCurrentProj,
            newVersion,
            automaticRelease,
            prod,
          });
        }
      } else {
        Helpers.info('Omitting npm publish...')
      }

      //#endregion
    }

    //#region build docs
    if (!global.tnpNonInteractive || automaticReleaseDocs) {
      // Helpers.clearConsole();
      await new Promise<void>(async (resolve, reject) => {
        if (this.__isStandaloneProject) {
          await this.__libStandalone.buildDocs(prod, realCurrentProj, automaticReleaseDocs, async () => {
            try {
              specyficProjectForBuild = await this.__releaseBuildProcess({
                realCurrentProj, releaseOptions, cutNpmPublishLibReleaseCode: false
              });
              resolve()
            } catch (error) {
              reject(error)
            }

          });
        }

        if (this.__isSmartContainer) {
          await this.__libSmartcontainer.buildDocs(prod, realCurrentProj, automaticReleaseDocs, async () => {
            try {
              specyficProjectForBuild = await this.__releaseBuildProcess({
                realCurrentProj, releaseOptions, cutNpmPublishLibReleaseCode: false
              });
              resolve()
            } catch (error) {
              reject(error)
            }

          });
        }
      });

      this.__commitRelease(newVersion);

    }
    //#endregion

    //#region push code to repo
    const docsCwd = realCurrentProj.pathFor('docs');


    if (!automaticReleaseDocs && Helpers.exists(docsCwd)) {
      await this.__displayInfoBeforePublish(realCurrentProj, DEFAULT_PORT.DIST_SERVER_DOCS);

    }

    await this.pushToGitRepo(realCurrentProj, newVersion, automaticReleaseDocs);
    if (!automaticReleaseDocs && Helpers.exists(docsCwd)) {
      await Helpers.killProcessByPort(DEFAULT_PORT.DIST_SERVER_DOCS)
    }
    //#endregion

    Helpers.info('RELEASE DONE');
    //#endregion
  }
  //#endregion

  //#region getters & methods / info before publish
  private async __displayInfoBeforePublish(realCurrentProj: Project, defaultTestPort: Number) {
    //#region @backendFunc
    if (this.__env.config?.useDomain) {
      Helpers.info(`Cannot local preview.. using doamin: ${this.__env.config.domain}`)
      return;
    }
    const originPath = `http://localhost:`;
    const docsCwd = realCurrentProj.pathFor('docs');
    if (!Helpers.exists(docsCwd)) {
      return;
    }
    await Helpers.killProcessByPort(DEFAULT_PORT.DIST_SERVER_DOCS)
    const commandHostLoclDocs = `firedev-http-server -s -p ${DEFAULT_PORT.DIST_SERVER_DOCS} --base-dir ${this.name}`;

    // console.log({
    //   cwd, commandHostLoclDocs
    // })
    Helpers.run(commandHostLoclDocs, { cwd: docsCwd, output: false, silence: true }).async()
    if (this.__isStandaloneProject) {
      Helpers.info(`Before pushing you can acces project here:

- ${originPath}${defaultTestPort}/${this.name}

`);
    }
    if (this.__isSmartContainer) {
      const smartContainer = this;
      const mainProjectName = smartContainer.__smartContainerBuildTarget.name
      const otherProjectNames = smartContainer
        .children
        .filter(c => c.name !== mainProjectName)
        .map(p => p.name);
      Helpers.info(`Before pushing you can acces projects here:

- ${originPath}${defaultTestPort}/${smartContainer.name}
${otherProjectNames.map(c => `- ${originPath}${defaultTestPort}/${smartContainer.name}/-/${c}`).join('\n')}

`);
    }

    //#endregion
  }
  //#endregion

  //#region getters & methods / recreate release project
  public async recreateReleaseProject() {
    this.remove(config.folder.tmpDistRelease);
    await this.__createTempCiReleaseProject()
  }
  //#endregion

  //#region getters & methods / create temp project
  private async __createTempCiReleaseProject(): Promise<Project> {
    //#region @backendFunc
    const absolutePathReleaseProject = this.__releaseCiProjectPath;

    if (!this.__checkIfReadyForNpm(true)) {
      Helpers.error(`Project "${this.name}" is not ready for npm release`, false, true)
    }

    if (this.__isStandaloneProject || this.__isSmartContainer) {
      Helpers.removeFolderIfExists(this.pathFor(config.folder.tmpDistRelease));

      const browserFolder = path.join(this.location, config.folder.browser);

      if (!Helpers.exists(browserFolder)) {
        Helpers.remove(browserFolder);
      }

      const websqlFolder = path.join(this.location, config.folder.websql);

      if (!Helpers.exists(websqlFolder)) {
        Helpers.remove(websqlFolder);
      }

      Helpers.removeFolderIfExists(absolutePathReleaseProject);
      Helpers.mkdirp(absolutePathReleaseProject);
      this.__copyManager.generateSourceCopyIn(absolutePathReleaseProject, {
        useTempLocation: true, // TODO not needed
        forceCopyPackageJSON: true, // TODO not needed
        dereference: true,
        regenerateProjectChilds: this.__isSmartContainer,
      });

      this.__packageJson.linkTo(absolutePathReleaseProject);
      if (this.__isStandaloneProject) {
        await this.__env.init();
        (this.__env as any as EnvironmentConfig).coptyTo(absolutePathReleaseProject)
      }

      if (this.__isSmartContainer) {
        const children = this.children;
        for (let index = 0; index < children.length; index++) {
          const child = children[index] as Project;
          await child.__env.init();
          (child.__env as any as EnvironmentConfig).coptyTo(crossPlatformPath([absolutePathReleaseProject, child.name]))
        }

      }

      const generatedProject = Project.ins.From(absolutePathReleaseProject) as Project;
      this.__allResources.forEach(relPathResource => {
        const source = path.join(this.location, relPathResource);
        const dest = path.join(absolutePathReleaseProject, relPathResource);
        if (Helpers.exists(source)) {
          if (Helpers.isFolder(source)) {
            Helpers.copy(source, dest, { recursive: true });
          } else {
            Helpers.copyFile(source, dest);
          }
        }
      })

      // this.linkedRepos.linkToProject(generatedProject as Project)
      this.__node_modules.linkToProject(generatedProject as Project);

      const vscodeFolder = path.join(generatedProject.location, config.folder._vscode);
      Helpers.removeFolderIfExists(vscodeFolder);
      await generatedProject.__insideStructure.recrate('dist');
      return generatedProject;

    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / release build
  private async __releaseBuildProcess({
    realCurrentProj, releaseOptions, cutNpmPublishLibReleaseCode
  }: { realCurrentProj: Project; releaseOptions: ReleaseOptions; cutNpmPublishLibReleaseCode: boolean; }) {
    //#region @backendFunc
    const { prod, cliBuildObscure, cliBuildIncludeNodeModules, cliBuildNoDts, cliBuildUglify } = releaseOptions;

    // TODO  - only here so  __smartContainerBuildTarget is available
    await this.init(InitOptions.from({}));

    const specyficProjectForBuild = this.__isStandaloneProject ? this : Project.ins.From(crossPlatformPath(path.join(
      this.location,
      config.folder.dist,
      this.name,
      this.__smartContainerBuildTarget.name,
    ))) as Project;

    await this.build(BuildOptions.from({
      buildType: 'lib',
      prod,
      cliBuildObscure,
      cliBuildIncludeNodeModules,
      cliBuildNoDts,
      cliBuildUglify,
      cutNpmPublishLibReleaseCode,
      skipProjectProcess: true,
      buildForRelease: true,
    }));

    //#region prepare release resources
    const dists = [
      crossPlatformPath([specyficProjectForBuild.location, config.folder.dist]),
      crossPlatformPath([
        specyficProjectForBuild.location,
        specyficProjectForBuild.__getTempProjName('dist'),
        config.folder.node_modules,
        realCurrentProj.name,
      ]),
    ];

    if (realCurrentProj.__isStandaloneProject) {
      for (let index = 0; index < dists.length; index++) {
        const releaseDistFolder = dists[index];
        specyficProjectForBuild.__createClientVersionAsCopyOfBrowser(releaseDistFolder);
      }
    }

    for (let index = 0; index < dists.length; index++) {
      const releaseDist = dists[index];
      specyficProjectForBuild.__compileBrowserES5version(releaseDist);
    }

    if (realCurrentProj.__isStandaloneProject) {
      for (let index = 0; index < dists.length; index++) {
        const releaseDist = dists[index];
        specyficProjectForBuild.__packResourceInReleaseDistResources(releaseDist);
      }
      specyficProjectForBuild.__copyEssentialFilesTo(dists, 'dist');
    } else if (realCurrentProj.__isSmartContainer) {
      const rootPackageName = `@${this.name}`;
      const base = path.join(
        specyficProjectForBuild.location,
        specyficProjectForBuild.__getTempProjName('dist'),
        config.folder.node_modules,
        rootPackageName,
      );
      const childrenPackages = Helpers.foldersFrom(base).map(f => path.basename(f))
      for (let index = 0; index < childrenPackages.length; index++) {
        const childName = childrenPackages[index];
        const child = Project.ins.From([realCurrentProj.location, childName]) as Project;
        const releaseDistFolder = path.join(base, childName);
        child.__packResourceInReleaseDistResources(releaseDistFolder);
      }
    }
    //#endregion


    return specyficProjectForBuild;

    //#endregion
  }
  //#endregion

  //#region getters & methods / build lib placeholder
  private async __buildLib(buildOptions: BuildOptions) {
    //#region @backendFunc
    Helpers.log(`[buildLib] called buildLib not implemented`);
    if (this.__isIsomorphicLib) {

      //#region preparing variables

      //#region preparing variables & fixing things
      const { outDir, watch, cutNpmPublishLibReleaseCode } = buildOptions;

      this.__fixBuildDirs(outDir);

      // Helpers.info(`[buildLib] start of building ${websql ? '[WEBSQL]' : ''}`);
      Helpers.log(`[buildLib] start of building...`);
      this.__copyEssentialFilesTo([crossPlatformPath([this.pathFor(outDir)])], outDir);


      const { cliBuildObscure, cliBuildUglify, cliBuildNoDts, cliBuildIncludeNodeModules } = buildOptions;
      const productionModeButIncludePackageJsonDeps = (cliBuildObscure || cliBuildUglify) && !cliBuildIncludeNodeModules;


      if (this.isInCiReleaseProject && (cliBuildObscure || cliBuildUglify)) {
        this.quickFixes.overritenBadNpmPackages();
      }
      //#endregion

      //#region preparing variables / incremental build
      const incrementalBuildProcess = new IncrementalBuildProcess(this, buildOptions.clone({
        websql: false
      }));

      const incrementalBuildProcessWebsql = new IncrementalBuildProcess(this, buildOptions.clone({
        websql: true,
        genOnlyClientCode: true,
      }));

      const proxyProject = this.__getProxyNgProj(buildOptions.clone({
        websql: false,
      }), 'lib');

      const proxyProjectWebsql = this.__getProxyNgProj(buildOptions.clone({
        websql: true
      }), 'lib');

      Helpers.log(`

    proxy Proj = ${proxyProject?.location}
    proxy Proj websql = ${proxyProjectWebsql?.location}

    `);

      //#endregion

      //#region preparing variables / general
      const isStandalone = (!this.__isSmartContainer);

      const sharedOptions = () => {
        return {
          // askToTryAgainOnError: true,
          exitOnErrorCallback: async (code) => {
            if (buildOptions.buildForRelease && !buildOptions.ci) {
              throw 'Typescript compilation lib error';
            } else {
              Helpers.error(`[${config.frameworkName}] Typescript compilation lib error (code=${code})`
                , false, true);
            }
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
        } as CoreModels.ExecuteOptions;
      };
      //#endregion

      //#region prepare variables / command
      // const command = `${loadNvm} && ${this.npmRunNg} build ${this.name} ${watch ? '--watch' : ''}`;
      const commandForLibraryBuild = `${this.__npmRunNg} build ${this.name} ${watch ? '--watch' : ''}`;
      //#endregion

      //#region prepare variables / angular info
      const showInfoAngular = () => {
        Helpers.info(`Starting browser Angular/TypeScirpt build.... ${buildOptions.websql ? '[WEBSQL]' : ''}`);
        Helpers.log(`

      ANGULAR ${Project.ins.Tnp?.version} ${buildOptions.watch ? 'WATCH ' : ''} LIB BUILD STARTED... ${buildOptions.websql ? '[WEBSQL]' : ''}

      `);

        Helpers.log(` command: ${commandForLibraryBuild}`);
      };
      //#endregion

      //#endregion

      if (buildOptions.watch) {
        if (productionModeButIncludePackageJsonDeps) {
          //#region webpack dist release build
          console.log('Startomg build')
          try {
            await incrementalBuildProcess.startAndWatch(`isomorphic compilation (only browser) `);

          } catch (error) {
            console.log('CATCH INCE normal');

          }

          try {
            await incrementalBuildProcessWebsql.startAndWatch(`isomorphic compilation (only browser) [WEBSQL]`);
          } catch (error) {
            console.log('CATCH INCE webcsal');
          }

          // Helpers.error(`Watch build not available for dist release build`, false, true);
          // Helpers.info(`Starting watch dist release build for fast cli.. ${this.buildOptions.websql ? '[WEBSQL]' : ''}`);
          Helpers.info(`Starting watch dist release build for fast cli.. `);

          try {
            await this.__webpackBackendBuild.run(BuildOptions.from({
              buildType: 'lib',
              outDir,
              watch,
            }));
          } catch (er) {
            Helpers.error(`WATCH ${outDir.toUpperCase()} build failed`, false, true);
          }
          //#endregion
        } else {
          //#region watch backend compilation

          await incrementalBuildProcess.startAndWatch('isomorphic compilation (watch mode)');
          await incrementalBuildProcessWebsql.startAndWatch('isomorphic compilation (watch mode) [WEBSQL]');

          if (this.__frameworkVersionAtLeast('v3')) { // TOOD
            showInfoAngular()

            if (isStandalone || (this.__isSmartContainerTarget)) {
              if (this.__isSmartContainerTarget) { // TODO QUICK_FIX this should be in init/struct
                PackagesRecognition.fromProject(this).start(true, 'before startling lib proxy project');
              }
              try {
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
              } catch (error) {
                console.log(error
                )
              }

            }
          }
          //#endregion
        }
      } else {
        //#region non watch build
        if (cutNpmPublishLibReleaseCode) {
          this.__cutReleaseCodeFromSrc(buildOptions);
        }

        if (productionModeButIncludePackageJsonDeps) {
          //#region release production backend build for firedev/tnp specyfic
          // console.log('k1')
          await incrementalBuildProcess.start('isomorphic compilation (only browser) ');
          await incrementalBuildProcessWebsql.start('isomorphic compilation (only browser) [WEBSQL] ');

          try {
            await this.__webpackBackendBuild.run(BuildOptions.from({
              buildType: 'lib',
              outDir,
              watch,
            }));
          } catch (er) {
            Helpers.error(`${outDir.toUpperCase()} (single file compilation) build failed`, false, true);
          }

          if (cliBuildNoDts) {
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
            if (cliBuildObscure || cliBuildUglify) {
              this.__backendCompileToEs5(outDir);
            }
            if (cliBuildUglify) {
              this.__backendUglifyCode(outDir, config.reservedArgumentsNamesUglify)
            };
            if (cliBuildObscure) {
              this.__backendObscureCode(outDir, config.reservedArgumentsNamesUglify);
            }

          } catch (er) {
            Helpers.error(`${outDir.toUpperCase()} (cliBuildObscure || cliBuildUglify) process failed`, false, true);
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
            this.__showMesageWhenBuildLibDoneForSmartContainer(buildOptions);
          } catch (e) {
            Helpers.log(e)
            Helpers.error(`
          Command failed: ${commandForLibraryBuild}

          Not able to build project: ${this.genericName}`, false, true)
          }

          //#endregion
        }

        if (cliBuildIncludeNodeModules) {
          const cliJsFile = 'cli.js';
          this.quickFixes.removeTnpFromItself(async () => {
            this.__backendIncludeNodeModulesInCompilation(
              outDir,
              false, // cliBuildUglify,
              cliJsFile,
            );
          });

          if (cliBuildUglify) {
            this.__backendUglifyCode(outDir, config.reservedArgumentsNamesUglify, cliJsFile)
          };
          if (!productionModeButIncludePackageJsonDeps) {
            if (cliBuildObscure || cliBuildUglify) {
              this.__backendCompileToEs5(outDir, cliJsFile);
            }
            if (cliBuildObscure) {
              this.__backendObscureCode(outDir, config.reservedArgumentsNamesUglify, cliJsFile);
            }
          }
        }

        if (cliBuildNoDts) {
          this.__backendRemoveDts(outDir);
        }


        if (cutNpmPublishLibReleaseCode) {
          this.__restoreCuttedReleaseCodeFromSrc(buildOptions);
        }
        //#endregion
        //#endregion
      }

      this.__showMesageWhenBuildLibDoneForSmartContainer(buildOptions);
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / copy essential files
  private __copyEssentialFilesTo(destinations: string[], outDir: 'dist') {
    //#region @backendFunc
    this.__copyWhenExist('bin', destinations);
    this.__linkWhenExist(config.file.package_json, destinations);
    config.packageJsonSplit.forEach(c => {
      this.__copyWhenExist(c, destinations);
    });
    this.__copyWhenExist('.npmrc', destinations);
    this.__copyWhenExist('.npmignore', destinations);
    this.__copyWhenExist('.gitignore', destinations);
    if (this.typeIs('isomorphic-lib')) {
      this.__copyWhenExist(config.file.tnpEnvironment_json, destinations);
    }

    if (this.isInCiReleaseProject) { // @LAST probably something else
      this.__copyWhenExist(config.file.package_json, destinations);
      this.__linkWhenExist(config.folder.node_modules, destinations);
      this.__copyWhenExist('package.json', destinations.map(d => crossPlatformPath([d, config.folder.client])));
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / remove (m)js.map files from release
  /**
   * because of that
   * In vscode there is a mess..
   * TODO
   */
  __removeJsMapsFrom(absPathReleaseDistFolder: string) {
    //#region @backendFunc
    return; // TODO not a good idea
    Helpers.filesFrom(absPathReleaseDistFolder, true)
      .filter(f => f.endsWith('.js.map') || f.endsWith('.mjs.map'))
      .forEach(f => Helpers.removeFileIfExists(f));
    //#endregion
  }
  //#endregion

  //#region getters & methods / get temp project name
  __getTempProjName(outdir: 'dist') {
    //#region @backendFunc
    const tempProjName = `tmp-local-copyto-proj-${outdir}`;
    return tempProjName;
    //#endregion
  }
  //#endregion

  //#region getters & methods / create client folder from browser folder
  private __createClientVersionAsCopyOfBrowser(releaseDistFolder: string) {
    //#region @backendFunc
    const browser = path.join(releaseDistFolder, config.folder.browser)
    const client = path.join(releaseDistFolder, config.folder.client)
    if (fse.existsSync(browser)) {
      Helpers.remove(client)
      Helpers.tryCopyFrom(browser, client);
    } else {
      Helpers.logWarn(`Browser folder not generated.. replacing with dummy files: browser.js, client.js`,
        false);
      const msg = `console.log('${this.genericName} only for backend') `;
      Helpers.writeFile(`${browser}.js`, msg);
      Helpers.writeFile(`${client}.js`, msg);
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / pack resources
  public __packResourceInReleaseDistResources(releaseDistFolder: string) {
    //#region @backendFunc
    this.__checkIfReadyForNpm()

    if (!fse.existsSync(releaseDistFolder)) {
      fse.mkdirSync(releaseDistFolder);
    }
    [].concat([
      ...this.__resources,
      ...(this.__isSmartContainerChild ? [
        config.file._npmignore,
        config.file.package_json__tnp_json5
      ] : [
        config.file._npmignore,
      ]),
    ]).forEach(res => { //  copy resource to org build and copy shared assets
      const file = path.join(this.location, res);
      const dest = path.join(releaseDistFolder, res);
      if (!fse.existsSync(file)) {
        Helpers.error(`[${config.frameworkName}][lib-project] Resource file: ${chalk.bold(path.basename(file))} does not `
          + `exist in "${this.genericName}"  (package.json > resources[])
        `, false, true)
      }
      if (fse.lstatSync(file).isDirectory()) {
        // console.log('IS DIRECTORY', file)
        // console.log('IS DIRECTORY DEST', dest)
        const filter = (src) => {
          return !/.*node_modules.*/g.test(src);
        };
        Helpers.copy(file, dest, { filter });
      } else {
        // console.log('IS FILE', file)
        fse.copyFileSync(file, dest);
      }
    })
    Helpers.logInfo(`Resources copied to release folder: ${config.folder.dist}`);
    //#endregion
  }
  //#endregion

  //#region getters & methods / remove tag nad commit
  /**
   * @deprecated
   */
  __removeTagAndCommit(automaticRelease: boolean) {
    //#region @backendFunc
    // Helpers.error(`PLEASE RUN: `, true, true);
    // if (!tagOnly) {
    //   Helpers.error(`git reset --hard HEAD~1`, true, true);
    // }
    Helpers.error(`'release problem... `, automaticRelease, true);
    // if (automaticRelease) {
    //   Helpers.error('release problem...', false, true);
    // }
    //#endregion
  }
  //#endregion

  //#region getters & methods / project linked files placeholder
  __projectLinkedFiles(): { sourceProject: Project, relativePath: string }[] {
    //#region @backendFunc
    const files = [];

    if (this.typeIs('isomorphic-lib')) {
      if (this.__frameworkVersionAtLeast('v2')) {
        files.push({
          sourceProject: Project.by(this.type, 'v1'),
          relativePath: 'webpack.backend-dist-build.js'
        });
      }
    }

    return files;
    //#endregion
  }
  //#endregion

  //#region getters & methods / recreate if not exits placeholder
  __recreateIfNotExists() {
    //#region @backendFunc
    if (this.__isVscodeExtension) {
      return [
        'src/config.ts',
      ]
    }
    return [];
    //#endregion
  }
  //#endregion

  //#region getters & methods / project specyfic files linked
  __projectSpecyficFilesLinked() {
    //#region @backendFunc
    let files = [];

    if (this.__isVscodeExtension) {
      files = [
        'src/extension.ts',
        'src/helpers.ts',
        'src/helpers-vscode.ts',
        'src/models.ts',
        'src/execute-command.ts',
        'src/progress-output.ts',
      ]
      if (this.__frameworkVersionAtLeast('v3')) {
        files = files.filter(f => f !== 'src/helpers-vscode.ts');
      }
    }

    return files;
    //#endregion
  }
  //#endregion

  //#region getters & methods / copy when exists
  protected __copyWhenExist(relativePath: string, destinations: string[]) {
    //#region @backendFunc
    const absPath = crossPlatformPath([this.location, relativePath]);

    for (let index = 0; index < destinations.length; index++) {
      const dest = crossPlatformPath([destinations[index], relativePath]);
      if (Helpers.exists(absPath)) {
        if (Helpers.isFolder(absPath)) {
          Helpers.remove(dest, true)
          Helpers.copy(absPath, dest, { recursive: true });
        } else {
          Helpers.copyFile(absPath, dest);
          if (path.basename(absPath) === config.file.tnpEnvironment_json) {
            Helpers.setValueToJSON(dest, 'currentProjectLocation', void 0);
          }
        }
      } else {
        Helpers.log(`[isomorphic-lib][copyWhenExist] not exists: ${absPath}`);
      }
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / link when exists
  protected __linkWhenExist(relativePath: string, destinations: string[]) {
    //#region @backendFunc
    let absPath = path.join(this.location, relativePath);

    if (Helpers.exists(absPath) && Helpers.isExistedSymlink(absPath)) {
      absPath = Helpers.pathFromLink(absPath);
    }

    for (let index = 0; index < destinations.length; index++) {
      const dest = crossPlatformPath([destinations[index], relativePath]);
      if (Helpers.exists(absPath)) {
        Helpers.remove(dest, true);
        Helpers.createSymLink(absPath, dest)
      }
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / commit release
  private __commitRelease(newVer?: string, message = 'new version') {
    //#region @backendFunc
    if (newVer) {
      this.git.stageAllAndCommit(`${message} ${newVer}`);
    } else {
      this.git.stageAllAndCommit('relese update')
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / compile es5
  private __compileBrowserES5version(pathReleaseDist: string) {
    //#region @backendFunc
    // TODO fix this for angular-lib
    if (this.__frameworkVersionAtLeast('v3')) {
      return;
    }

    if (this.__frameworkVersionEquals('v1') || this.typeIsNot('isomorphic-lib')) {
      return;
    }


    const cwdBrowser = path.join(pathReleaseDist, config.folder.browser);
    const cwdClient = path.join(pathReleaseDist, config.folder.client);
    const pathBabelRc = path.join(cwdBrowser, config.file._babelrc);
    const pathCompiled = path.join(cwdBrowser, 'es5');
    const pathCompiledClient = path.join(cwdClient, 'es5');
    Helpers.writeFile(pathBabelRc, '{ "presets": ["env"] }\n');
    try {
      Helpers.run(`babel . -d es5`, { cwd: cwdBrowser }).sync();
      Helpers.copy(pathCompiled, pathCompiledClient);
    } catch (err) {
      Helpers.removeFileIfExists(pathBabelRc);
      Helpers.error(err, true, true);
      Helpers.error(`Not able to create es5 version of lib`, false, true);
    }
    Helpers.removeFileIfExists(pathBabelRc);
    //#endregion
  }
  //#endregion

  //#region getters & methods / push to git repo
  async pushToGitRepo(realCurrentProj: Project, newVersion?: string, pushWithoutAsking = false) {
    //#region @backendFunc
    const pushFun = async () => {
      if (newVersion) {
        const tagName = `v${newVersion}`;
        const commitMessage = ('new version ' + newVersion);
        try {
          realCurrentProj.run(`git tag -a ${tagName} `
            + `-m "${commitMessage}"`,
            { output: false }).sync();
        } catch (error) {
          Helpers.error(`Not able to tag project`, false, true);
        }
        const lastCommitHash = realCurrentProj.git.lastCommitHash();
        realCurrentProj.__packageJson.setBuildHash(lastCommitHash);
        realCurrentProj.__packageJson.save('updating hash');
        realCurrentProj.__commitRelease(newVersion, `build hash update`);
      } else {
        realCurrentProj.__commitRelease();
      }

      Helpers.log('Pushing to git repository... ')
      Helpers.log(`Git branch: ${realCurrentProj.git.currentBranchName}`);
      await realCurrentProj.git.pushCurrentBranch({ askToRetry: true });
      Helpers.info('Pushing to git repository done.');
    };

    if (pushWithoutAsking) {
      await pushFun();
    } else {
      await Helpers.questionYesNo('Push changes to git repo ?', async () => {
        await pushFun();
      });
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / get available isomorpic packages in node_modules
  get __availableIsomorphicPackagesInNodeModules(): string[] {
    //#region @backendFunc
    const jsonPath = path.join(this.location, PackagesRecognition.FILE_NAME_ISOMORPHIC_PACKAGES);
    try {
      const json = Helpers.readJson(jsonPath) as { isomorphicPackages: string[]; };
      return (json && _.isArray(json.isomorphicPackages)) ? json.isomorphicPackages : [];
    } catch (error) {
      return [];
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / get trusted packages from tnp
  get __trusted(): string[] {
    //#region @backendFunc
    const projTnp = Project.ins.Tnp;

    let trusted = [];
    if (config.frameworkName === 'tnp') {
      const value = Helpers.readValueFromJson(crossPlatformPath([
        projTnp.location,
        config.file.package_json__tnp_json5, // TODO replace with firedev.json5 in future
      ]), `core.dependencies.trusted.${this.__frameworkVersion}`);
      if (value === '*') {
        return [];
      }
      trusted = value;
    }

    if (config.frameworkName === 'firedev') {
      const value = Helpers.readValueFromJson(crossPlatformPath([
        projTnp.location,
        config.file.tnpEnvironment_json,
      ]), `packageJSON.tnp.core.dependencies.trusted.${this.__frameworkVersion}`);
      if (value === '*') {
        return [];
      }
      trusted = value;
    }

    if (!Array.isArray(trusted)) {
      return [];
    }
    return Helpers.arrays.uniqArray([
      ...trusted,
      ...this.__additionalTrustedPackages,
    ]);
    //#endregion
  }
  //#endregion

  //#region getters & methods / get trusted max major version
  get __trustedMaxMajorVersion(): number | undefined {
    //#region @backendFunc
    const projTnp = Project.ins.Tnp;

    let trustedValue: number;
    if (config.frameworkName === 'tnp') {
      const value = Helpers.readValueFromJson(crossPlatformPath([
        projTnp.location,
        config.file.package_json__tnp_json5, // TODO replace with firedev.json5 in future
      ]), `core.dependencies.trustedMaxMajor.${this.__frameworkVersion}`);
      trustedValue = value;
    }

    if (config.frameworkName === 'firedev') {
      const file = crossPlatformPath([
        projTnp.location,
        config.file.tnpEnvironment_json,
      ]);
      const value = Helpers.readValueFromJson(file, `packageJSON.tnp.core.dependencies.trustedMaxMajor.${this.__frameworkVersion}`);
      trustedValue = value;
    }
    trustedValue = Number(trustedValue);
    return (_.isNumber(trustedValue) && !isNaN(trustedValue)) ? trustedValue : Number.POSITIVE_INFINITY;
    //#endregion
  }
  //#endregion

  //#region getters & methods / get additional trusted pacakges
  get __additionalTrustedPackages(): string[] {
    //#region @backendFunc
    const projTnp = Project.ins.Tnp;

    let trustedValue = [];
    if (config.frameworkName === 'tnp') {
      const value = Helpers.readValueFromJson(crossPlatformPath([
        projTnp.location,
        config.file.package_json__tnp_json5, // TODO replace with firedev.json5 in future
      ]), `core.dependencies.additionalTrusted`);
      trustedValue = value;
    }

    if (config.frameworkName === 'firedev') {
      const file = crossPlatformPath([
        projTnp.location,
        config.file.tnpEnvironment_json,
      ]);
      const value = Helpers.readValueFromJson(file, `packageJSON.tnp.core.dependencies.additionalTrusted`);
      trustedValue = value;
    }

    const additionalTrusted = Array.isArray(trustedValue) ? trustedValue : [];
    // console.log({
    //   additionalTrusted
    // })
    return additionalTrusted;
    //#endregion
  }
  //#endregion

  //#region getters & methods / vscode *.filetemplae
  get __vscodeFileTemplates() {
    //#region @backendFunc
    if (this.__frameworkVersionAtLeast('v2')) {
      return [
        // '.vscode/tasks.json.filetemplate',
      ];
    }
    return [];
    //#endregion
  }
  //#endregion

  //#region getters & methods / build steps
  protected async __buildSteps(buildOptions?: BuildOptions, libBuildDone?: () => void) {
    //#region @backendFunc
    if (this.__isVscodeExtension) {
      //#region vscode build
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
      return;
      //#endregion
    }
    if (this.__isSmartContainer) {
      //#region use proxy project to build smart container
      if (!fse.existsSync(this.location)) {
        return;
      }
      let { outDir, smartContainerTargetName } = buildOptions;

      let proxy = this.__proxyProjFor(smartContainerTargetName || this.__smartContainerBuildTarget?.name, outDir);
      await proxy.__buildSteps(buildOptions, libBuildDone);
      //#endregion
    }
    if (this.__isIsomorphicLib) {
      if (buildOptions.libBuild) {
        await this.__buildLib(buildOptions);
      }
      await Helpers.runSyncOrAsync({ functionFn: libBuildDone });
      if (buildOptions.appBuild) {
        await this.__buildApp(buildOptions);
      }
    }
    //#endregion
  }
  //#endregion

  __getElectronAppRelativePath({ websql }: { websql: boolean; }) {
    return `tmp-build/electron-app-dist${websql ? '-websql' : ''}`
  }

  //#region getters & methods / build
  async build(buildOptions?: BuildOptions) {
    //#region @backendFunc

    //#region handle electron
    if (buildOptions.targetApp === 'electron') {
      if (this.__isStandaloneProject) {
        const elecProj = Project.ins.From(this.pathFor([
          `tmp-apps-for-${config.folder.dist}${buildOptions.websql ? '-websql' : ''}`
          , this.name,
        ]));
        Helpers.info('Starting electron...')

        if (buildOptions.watch) {
          elecProj.run(`npm-run  electron . --serve ${buildOptions.websql ? '--websql' : ''}`).async();
        } else {
          if (buildOptions.buildForRelease) {
            // if (!this.pathExists(`tmp-apps-for-dist/${this.name}/electron/compiled/app.electron.js`)) {
            //   // await this.build(buildOptions.clone({
            //   //   buildForRelease: false,
            //   //   watch: false
            //   // }))
            // } else {
            //   Helpers.info('Initing before release build...')
            await this.init();
            // }

            const elecProj = Project.ins.From(this.pathFor([`tmp-apps-for-dist${buildOptions.websql ? '-websql' : ''}`
              , this.name]));
            elecProj.run('npm-run ng build angular-electron').sync();
            elecProj.run('npm-run ncc build electron/main.js -o electron/bundled  --no-cache').sync();
            elecProj.run(`npm-run electron-builder build --publish=never`).sync();
            this.openLocation(this.__getElectronAppRelativePath({ websql: buildOptions.websql }))
          } else {
            // TODO
          }
        }
        return;
      } else {
        Helpers.error(`Electron apps compilation only for standalone projects`, false, true);
      }
      buildOptions.finishCallback();
    }
    //#endregion

    //#region prevent empty firedev node_modules
    if (!this.__copyManager.coreContainerSmartNodeModulesProj) {
      Helpers.error(`${_.upperFirst(config.frameworkName)} has incorrect/missing packages container.
Please use command:

      ${config.frameworkName} autoupdate
      // or
      ${config.frameworkName} au

to fix it.
      `, false, true)
    }
    //#endregion

    //#region prevent not requested framework version
    if (this.__frameworkVersionLessThan('v4')) {
      Helpers.error(`Please upgrade firedev framework version to to at least v4

      ${config.file.package_json__tnp_json} => tnp.version => should be at least 4

      `, false, true);
    }
    //#endregion

    let libContext: Firedev.FrameworkContext;

    if (buildOptions.libBuild) {
      //#region main lib code build ports assignations
      const projectInfoPort = await this.assignFreePort(4100);
      this.__setProjectInfoPort(projectInfoPort);
      Helpers.writeFile(this.pathFor(tmpBuildPort), projectInfoPort?.toString());

      const hostForBuild = `http://localhost:${projectInfoPort}`;

      // Firedev.destroyContext(hostForBuild);
      if (!buildOptions?.skipProjectProcess) {
        //#region check build message
        Helpers.info(`



      You can check info about build in ${chalk.bold(hostForBuild)}



            `);
        //#endregion

        Helpers.taskStarted(`starting project service... ${hostForBuild}`);
        try {
          // TOOD @UNCOMMEND
          const context = await Firedev.init({
            mode: 'backend/frontend-worker',
            host: hostForBuild,
            controllers: [
              BuildProcessController,
            ],
            entities: [
              BuildProcess,
            ],
            //#region @websql
            config: {
              type: 'better-sqlite3',
              database:
                //  config.frameworkName === 'firedev' ?
                ':memory:'
              //  as any : this.pathFor(`tmp-build-process.sqlite`)
              ,
              logging: false,
            }
            //#endregion
          });
          const controller: BuildProcessController = context.getInstanceBy(BuildProcessController) as any;
          await controller.initialize(this);
          libContext = context;
        } catch (error) {
          console.error(error);
          Helpers.error(`Please reinstall ${config.frameworkName} node_modules`, false, true);
        }
      }


      this.__saveLaunchJson(projectInfoPort);
      Helpers.taskDone('project service started')
      // console.log({ context })
      //#endregion

      //#region normal/watch lib build
      if (buildOptions.watch) {
        await this.__filesStructure.init(InitOptions.from({ watch: true }));
      } else {
        await this.__filesStructure.init(InitOptions.from({}));
      }
      //#endregion
    }

    if (buildOptions.appBuild) { // TODO is this ok baw is not initing ?
      //#region initializae client app remote connection to build server
      if (!libContext) {
        const projectInfoPortFromFile = Number(Helpers.readFile(this.pathFor(tmpBuildPort)));
        this.__setProjectInfoPort(projectInfoPortFromFile);

        const hostForAppWorker = `http://localhost:${projectInfoPortFromFile}`;
        // console.log({ hostForAppWorker })
        if (!buildOptions?.skipProjectProcess) {
          try {
            Firedev.destroyContext(hostForAppWorker);
            const context = await Firedev.init({
              mode: 'remote-backend',
              host: hostForAppWorker,
              controllers: [
                BuildProcessController,
              ],
              entities: [
                BuildProcess,
              ]
            });
            const controller: BuildProcessController = context.getInstanceBy(BuildProcessController) as any;
            await controller.initialize(this);
          } catch (error) {
            console.error(error);
            Helpers.error(`Please reinstall ${config.frameworkName} node_modules`, false, true);
          }
          this.__saveLaunchJson(projectInfoPortFromFile);
        }
      }
      //#endregion


      if (!this.__node_modules.exist) {
        //#region prevent empty node_modules
        Helpers.error(`Please start lib build first:

        ${config.frameworkName} build:watch # short -> ${config.frameworkName} bw
or use command:

${config.frameworkName} start

        `, false, true);
        //#endregion
      }

    }

    if (!this.__isVscodeExtension) {
      PackagesRecognition.fromProject(this as any).start(void 0, '[buildable-project]');
    }

    //#region build assets file
    /**
     * Build assets file for app in app build mode
     */
    const buildAssetsFile = async () => {
      // console.log('after build steps');

      const shouldGenerateAssetsList = this.__isSmartContainer || (this.__isStandaloneProject && !this.__isSmartContainerTarget);
      // console.log({ shouldGenerateAssetsList })
      if (shouldGenerateAssetsList) {
        if (buildOptions.watch) {
          await this.__assetsFileListGenerator.startAndWatch(this.__smartContainerBuildTarget?.name, buildOptions.outDir, buildOptions.websql);
        } else {
          await this.__assetsFileListGenerator.start(this.__smartContainerBuildTarget?.name, buildOptions.outDir, buildOptions.websql);
        }
      }
    };
    //#endregion

    //#region start copy to manager function
    const startCopyToManager = async () => {

      Helpers.info(`${buildOptions.watch ? 'files watch started...' : ''}`);
      Helpers.log(`[buildable-project] Build steps ended (project type: ${this.type}) ... `);

      if (!buildOptions.appBuild) {
        if ((this.__isStandaloneProject && this.typeIs('isomorphic-lib')) || this.__isSmartContainer) {

          // // console.log('after build steps')
          this.__copyManager.init(buildOptions);
          const taskName = 'copyto manger';
          if (buildOptions.watch) {
            await this.__copyManager.startAndWatch({ taskName })
          } else {
            await this.__copyManager.start({ taskName })
          }
        }
      }
    };
    //#endregion

    //#region start build

    // console.log('before build steps')
    await this.__buildSteps(buildOptions, async () => {
      if (buildOptions.appBuild) {
        await buildAssetsFile();
      }
      if (buildOptions.libBuild) {
        await startCopyToManager();
      }
    });
    //#endregion

    const msg = (buildOptions.watch ? `
      Files watcher started.. ${buildOptions.websql ? '[WEBSQL]' : ''}
    `: `
      End of Building ${this.genericName} ${buildOptions.websql ? '[WEBSQL]' : ''}

    ` )

    Helpers.info(msg);
    buildOptions.finishCallback();
    //#endregion
  }
  //#endregion

  //#region getters & methods / info
  async info() {
    //#region @backendFunc
    console.info(`

    name: ${this.name}
    basename: ${this.basename}
    version: ${this.version}
    private: ${this.__packageJson?.isPrivate}
    monorepo: ${this.__isMonorepo}
    parent: ${this.parent?.name}
    grandpa: ${this.grandpa?.name}

    isStandaloneProject: ${this.__isStandaloneProject}
    isCoreProject: ${this.__isCoreProject}
    isSmartContainer: ${this.__isSmartContainer}
    isSmartContainerChild: ${this.__isSmartContainerChild}
    isSmartContainerTarget: ${this.__isSmartContainerTarget}
    isSmartContainerTargetNonClient: ${this.__isSmartContainerTargetNonClient}

    genericName: ${this.genericName}

    frameworkVersion: ${this.__frameworkVersion}
    type: ${this.type}
    parent name: ${this.parent && this.parent.name}
    grandpa name: ${this.grandpa && this.grandpa.name}
    git origin: ${this.git.originURL}
    git branch name: ${this.git.currentBranchName}
    git commits number: ${this.git.countComits()}

    location: ${this.location}


    children (${this.children?.length || 0}):
${(this.children || []).map(c => '- ' + c.__packageJson.name).join('\n')}

    `)
    // }
    //#endregion
  }
  //#endregion

  //#region getters & methods / recreate settings worksapce
  __recreateCodeWorkspace() {
    //#region @backendFunc
    const configSettings = {};

    try {
      const settings = json5.parse(Helpers.readFile(path.join(this.location, '.vscode', 'settings.json')));
      // console.log(settings)
      Object.keys(settings)
        .filter(key => {
          const isWorkbenchKey = key.startsWith('workbench');
          // console.log(`${key} ${start}`)
          return isWorkbenchKey;
        })
        .forEach(key => {
          configSettings[key] = settings[key];
        });
    } catch (err) {
      // console.log(err)
    }

    const packaedDistChildrensFolder = path.join(this.location, config.folder.dist);
    if (!fse.existsSync(packaedDistChildrensFolder)) {
      Helpers.mkdirp(packaedDistChildrensFolder);
    }
    configSettings['terminal.integrated.cwd'] = '${workspaceFolder}';

    const codeworkspacefilepath = path.join(this.location, `tmp.code-workspace`);
    Helpers.removeFileIfExists(codeworkspacefilepath)
    // fse.writeJSONSync(codeworkspacefilepath, codeWorkspace, {
    //   encoding: 'utf8',
    //   spaces: 2
    // });
    //#endregion
  }
  //#endregion

  //#region getters & methods / open in vscode
  public __openInVscode() {
    //#region @backendFunc
    this.__recreateCodeWorkspace()
    if (this.__isStandaloneProject || this.isUnknowNpmProject) {
      this.run(`code ${this.location}`).sync()
    } else {
      const isomorphicServers: Project[] = this.children.filter(c => c.typeIs('isomorphic-lib'));

      this.run(`code ${this.location}`).sync();
      isomorphicServers.forEach(s => {
        s.run(`code ${s.location}`).sync()
      });
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / vscode lanuch runtime args
  get __vscodeLaunchRuntimeArgs() {
    //#region @backendFunc
    return [
      "--nolazy",
      "-r",
      "ts-node/register",
      // "--preserve-symlinks", NOT WORKING
      // "--preserve-symlinks-main",NOT WORKING
      "--experimental-worker"
    ];
    //#endregion
  }
  //#endregion

  //#region getters & methods / save lanunch json
  public __saveLaunchJson(basePort: number) {
    //#region @backendFunc
    if (this.__isSmartContainer) {
      //#region container save
      const container = this;
      const configurations = container.children.filter(f => {
        return f.__frameworkVersionAtLeast('v3') && f.typeIs('isomorphic-lib');
      }).map((c, index) => {
        const backendPort = PortUtils.instance(basePort).calculateServerPortFor(c);
        c.writeFile('src/app.hosts.ts', PortUtils.instance(basePort).appHostTemplateFor(c))
        return {
          "type": "node",
          "request": "launch",
          "name": `Launch Server @${container.name}/${c.name}`,
          "cwd": "${workspaceFolder}" + `/dist/${container.name}/${c.name}`,
          "program": "${workspaceFolder}" + `/dist/${container.name}/${c.name}/run-org.js`,
          "args": [
            `--child=${c.name}`,
            `--port=${backendPort}`
          ],
          // "sourceMaps": true,
          // "outFiles": [ // TODOD this is causing unbound breakpoing in thir party modules
          //   "${workspaceFolder}" + ` / dist / ${ container.name } / ${ c.name } / dist/**/ *.js`
          // ],
          runtimeArgs: this.__vscodeLaunchRuntimeArgs,
          "presentation": {
            "group": "workspaceServers"
          }
        }
      })

      const temlateSmartContine = {
        "version": "0.2.0",
        configurations,
        // "compounds": []
      };



      const launchJSOnFilePath = path.join(container.location, '.vscode/launch.json')
      Helpers.writeFile(launchJSOnFilePath, temlateSmartContine);
      //#endregion

    } else if (this.__isStandaloneProject && !this.__isSmartContainerTarget) {
      //#region standalone save

      let configurations = [];
      let compounds: { name: string; configurations: any[] }[] = [];

      //#region template attach process
      const temlateAttachProcess = {
        'type': 'node',
        'request': 'attach',
        'name': 'Attach to global cli tool',
        'port': 9229,
        'skipFiles': [
          '<node_internals>/**'
        ],
        // "outFiles": ["${workspaceFolder}/dist/**/*.js"] // not wokring for copy manager
      };
      //#endregion

      //#region tempalte start normal nodejs server
      const templateForServer = (serverChild: Project, clientProject: Project, workspaceLevel: boolean) => {
        const backendPort = PortUtils.instance(basePort).calculateServerPortFor(serverChild);
        clientProject.writeFile('src/app.hosts.ts', PortUtils.instance(basePort).appHostTemplateFor(serverChild))
        const startServerTemplate = {
          'type': 'node',
          'request': 'launch',
          'name': 'Launch Server',
          'program': '${workspaceFolder}/run.js',
          'cwd': void 0,
          'args': [`port=${backendPort}`],
          // "outFiles": ["${workspaceFolder}/dist/**/*.js"], becouse of this debugging inside node_moudles
          // with compy manager created moduels does not work..
          runtimeArgs: this.__vscodeLaunchRuntimeArgs
        };
        if (serverChild.name !== clientProject.name) {
          let cwd = '${workspaceFolder}' + `/../ ${serverChild.name}`;
          if (workspaceLevel) {
            cwd = '${workspaceFolder}' + `/${serverChild.name}`;
          }
          startServerTemplate.program = cwd + '/run.js';
          startServerTemplate.cwd = cwd;
        }
        if ((serverChild.location === clientProject.location) && serverChild.__isStandaloneProject) {
          startServerTemplate.name = `${startServerTemplate.name} standalone`
        } else {
          startServerTemplate.name = `${startServerTemplate.name} ${serverChild.name} for ${clientProject.name}`
        }
        startServerTemplate.args.push(`--ENVoverride=${encodeURIComponent(JSON.stringify({
          clientProjectName: clientProject.name
        } as Models.EnvConfig, null, 4))
          } `);
        return startServerTemplate;
      };
      //#endregion

      //#region tempalte start nodemon nodejs server
      // const startNodemonServer = () => {
      //   const result = {
      //     'type': 'node',
      //     'request': 'launch',
      //     'remoteRoot': '${workspaceRoot}',
      //     'localRoot': '${workspaceRoot}',
      //     'name': 'Launch Nodemon server',
      //     'runtimeExecutable': 'nodemon',
      //     'program': '${workspaceFolder}/run.js',
      //     'restart': true,
      //     'sourceMaps': true,
      //     'console': 'internalConsole',
      //     'internalConsoleOptions': 'neverOpen',
      //     runtimeArgs: this.__vscodeLaunchRuntimeArgs
      //   };
      //   return result;
      // }
      //#endregion

      //#region  tempalte start ng serve

      // /**
      //  * @deprecated
      //  */
      // const startNgServeTemplate = (servePort: number, workspaceChild: Project, workspaceLevel: boolean) => {
      //   const result = {
      //     'name': 'Debugger with ng serve',
      //     'type': 'chrome',
      //     'request': 'launch',
      //     cwd: void 0,
      //     // "userDataDir": false,
      //     'preLaunchTask': 'Ng Serve',
      //     'postDebugTask': 'terminateall',
      //     'sourceMaps': true,
      //     // "url": `http://localhost:${!isNaN(servePort) ? servePort : 4200}/#`,
      //     'webRoot': '${workspaceFolder}',
      //     'sourceMapPathOverrides': {
      //       'webpack:/*': '${webRoot}/*',
      //       '/./*': '${webRoot}/*',
      //       '/tmp-src/*': '${webRoot}/*',
      //       '/*': '*',
      //       '/./~/*': '${webRoot}/node_modules/*'
      //     }
      //   }
      //   if (workspaceChild) {
      //     result.cwd = '${workspaceFolder}' + `/${workspaceChild.name}`;
      //     result.webRoot = '${workspaceFolder}' + `/${workspaceChild.name}`;
      //     result.name = `${result.name} for ${workspaceChild.name}`
      //   }
      //   if (workspaceLevel) {
      //     result.preLaunchTask = `${result.preLaunchTask} for ${workspaceChild.name}`;
      //   }
      //   return result;
      // };
      //#endregion

      //#region electron
      const startElectronServeTemplate = (remoteDebugElectronPort: number) => {
        return {
          "name": "Start electron app debug",
          "type": "node",
          "request": "launch",
          "protocol": "inspector",
          "cwd": "${workspaceFolder}",
          "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
          "trace": "verbose",
          "runtimeArgs": [
            "--serve",
            ".",
            `--remote-debugging-port=${remoteDebugElectronPort}`// 9876
          ],
          "windows": {
            "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
          }
        }
      }
      //#endregion

      //#region handle standalone or worksapce child
      if (this.typeIs('isomorphic-lib')) {
        configurations = [
          // startNodemonServer()
        ];
        if (this.__isStandaloneProject) {
          configurations.push(templateForServer(this, this, false));
          // configurations.push(startNgServeTemplate(9000, void 0, false));
          configurations.push(startElectronServeTemplate(PortUtils.instance(basePort).calculatePortForElectronDebugging(this)))
          compounds.push({
            name: 'Debug Server + Electron App',
            configurations: [
              ...configurations.map(c => c.name)
            ]
          });
          configurations.push(temlateAttachProcess);
        }
      }
      //#endregion

      const launchJSOnFilePath = path.join(this.location, '.vscode/launch.json');

      Helpers.writeJson(launchJSOnFilePath, {
        version: '0.2.0',
        configurations,
        compounds
      });
      //#endregion
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods /set minor version
  /**
   * {
   *  version: "<major>.<minor>.<path>"
   * }
   *
   * This function is setting minor version
   * example
   * {
   *  version:"3.1.4"
   * }
   * with @param minorVersionToSet equals 4
   * will result in
   * {
   *  version:"3.4.4"
   * }
   */
  async __setMinorVersion(minorVersionToSet: number, force = false) {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return '';
    }

    minorVersionToSet = Number(minorVersionToSet);
    if (isNaN(minorVersionToSet) || !Number.isInteger(minorVersionToSet)) {
      Helpers.error(`Wrong minor version to set: ${minorVersionToSet}`, false, true);
    }

    const ver = this.version.split('.');
    if (ver.length !== 3) {
      Helpers.error(`Wrong version in project: ${this}`, false, true);
    }

    const currentMinorVersion = Number(ver[1]);
    const newVer = [ver[0], minorVersionToSet, 0].join('.');

    if (minorVersionToSet <= currentMinorVersion && !force) {
      Helpers.warn(`Ommiting... Trying to set same or lower minor version for project: ${this.genericName}
        ${this.version} => v${newVer}
      `)
    } else {
      await this.__setNewVersion(newVer);
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / set major version
  /**
   * {
   *  version: "<major>.<minor>.<path>"
   * }
   *
   * This function is setting minor version
   * example
   * {
   *  version:"3.1.4"
   * }
   * with @param minorVersionToSet equals 15
   * will result in
   * {
   *  version:"15.1.4"
   * }
   */
  async __setMajorVersion(majorVersionToSet: number) {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return '';
    }

    majorVersionToSet = Number(majorVersionToSet);
    if (isNaN(majorVersionToSet) || !Number.isInteger(majorVersionToSet)) {
      Helpers.error(`Wrong major version to set: ${majorVersionToSet}`, false, true);
    }

    const ver = this.version.split('.');
    if (ver.length !== 3) {
      Helpers.error(`Wrong version in project: ${this}`, false, true);
    }

    const currentMajorVersion = Number(ver[0]);
    const newMajorVer = [majorVersionToSet, ver[1], ver[2]].join('.');

    if (majorVersionToSet <= currentMajorVersion) {
      Helpers.warn(`Ommiting... Trying to set same or lower minor version for project: ${this.genericName}
        ${this.version} => v${newMajorVer}
      `)
    } else {
      await this.__setNewVersion(newMajorVer);
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / set framework version
  async __setFramworkVersion(frameworkVersionArg: CoreModels.FrameworkVersion) {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return '';
    }
    this.__packageJson.data.tnp.version = frameworkVersionArg;
    this.__packageJson.save('updating framework version');
    //#endregion
  }
  //#endregion

  //#region getters & methods / set new version
  async __setNewVersion(version: string) {
    //#region @backendFunc
    Helpers.info(`Setting version to project  ${this.genericName}: v${version}`);
    this.__packageJson.data.version = version;
    this.__packageJson.save('updating version');
    //#endregion
  }
  //#endregion

  //#region getters & methods / should be ommited in release
  get __shouldBeOmmitedInRelease() {
    //#region @backendFunc
    return !!this.__packageJson['omitInRelease'];
    //#endregion
  }
  //#endregion

  //#region getters & methods / last npm version
  get __lastNpmVersion() {
    //#region @backendFunc
    const lastVer = 'last npm version(s): ';
    if (this.__isSmartContainer) {
      return lastVer + this.children.map(c => {
        let lastNpmVersion = void 0 as string;
        try {
          const ver = Helpers.run(`npm show @${this.name}/${c.name} version`, { output: false }).sync().toString();
          if (ver) {
            lastNpmVersion = ver.trim();
          }
        } catch (error) { }
        return `${this.name}/${c.name}=${lastNpmVersion}`;
      }).join(', ');

    } else {
      let lastNpmVersion = void 0 as string;
      try {
        const ver = this.run(`npm show ${this.name} version`, { output: false }).sync().toString();
        if (ver) {
          lastNpmVersion = ver.trim();
        }
      } catch (error) { }
      return lastVer + lastNpmVersion;
    }

    //#endregion
  }
  //#endregion

  //#region getters & methods / resouces
  get __resources(): string[] {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return []
    }
    return this.__packageJson.resources;
    //#endregion
  }
  //#endregion

  //#region getters & methods / is unknow npm project
  get isUnknowNpmProject() {
    //#region @backendFunc
    return this.typeIs('unknow-npm-project');
    //#endregion
  }
  //#endregion

  getVersionFor(releaseType: CoreModels.ReleaseType): string {
    //#region @backendFunc
    if (releaseType === 'patch') {
      return this.__versionPatchedPlusOne;
    }
    if (releaseType === 'minor') {
      return this.__versionMinorPlusWithZeros;
    }
    if (releaseType === 'major') {
      return this.__versionMajorPlusWithZeros;
    }
    //#endregion
  }

  //#region getters & methods / version patched plus one
  get __versionPatchedPlusOne() {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return '';
    }
    if (!this.version) {

      if (!global[CoreConfig.message.globalSystemToolMode]) {
        return;
      }

      Helpers.error(`Please define ${chalk.bold('version')} property in your package.json:
      location: ${path.join(this.location, config.file.package_json)}

      `, true, true);
    }
    const ver = this.version.split('.');
    if (ver.length > 0) {
      ver[ver.length - 1] = (parseInt(_.last(ver)) + 1).toString();
    }
    return ver.join('.')
    //#endregion
  }
  //#endregion

  //#region getters & methods / version major plus with zeros
  get __versionMajorPlusWithZeros() {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return '';
    }
    if (!this.version) {

      if (!global[CoreConfig.message.globalSystemToolMode]) {
        return;
      }

      Helpers.error(`Please define ${chalk.bold('version')} property in your package.json:
      location: ${path.join(this.location, config.file.package_json)}

      `, true, true);
    }
    const ver = this.version.split('.');
    if (ver.length > 0) {
      ver[0] = (parseInt(_.first(ver)) + 1).toString();
      for (let index = 1; index < ver.length; index++) {
        ver[index] = '0';
      }
    } else {
      Helpers.warn(`[npm-project] something went wrong with bumping major version`)
    }
    return ver.join('.');
    //#endregion
  }
  //#endregion

  //#region getters & methods / version minor plus with zero
  get __versionMinorPlusWithZeros() {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return '';
    }
    if (!this.version) {

      if (!global[CoreConfig.message.globalSystemToolMode]) {
        return;
      }

      Helpers.error(`Please define ${chalk.bold('version')} property in your package.json:
      location: ${path.join(this.location, config.file.package_json)}

      `, true, true);
    }
    const ver = this.version.split('.');
    if (ver.length > 1) {
      ver[1] = (parseInt(ver[1]) + 1).toString();
      for (let index = 2; index < ver.length; index++) {
        ver[index] = '0';
      }
    } else {
      Helpers.warn(`[npm-project] something went wrong with bumping minor version`)
    }
    return ver.join('.');
    //#endregion
  }
  //#endregion

  //#region getters & methods / update version path release
  __updateVersionPathRelease(versionPath: number) {
    //#region @backendFunc
    const ver = this.version.split('.');
    if (ver.length > 0) {
      ver[ver.length - 1] = versionPath.toString();
    }
    const versionToUpdate = ver.join('.');
    this.__packageJson.data.version = versionToUpdate.toString();
    this.__packageJson.save(`[npm-project] updating version path`);
    //#endregion
  }
  //#endregion

  //#region getters & methods / bump version for path release
  __bumpVersionForPathRelease(proj: Project) {
    //#region @backendFunc
    let atLestVersion = proj.git.lastTagVersionName.trim().replace('v', '') || '0.0.0';
    if (semver.gt(proj.version, atLestVersion)) {
      atLestVersion = proj.version;
    }

    proj.__packageJson.data.version = atLestVersion;
    proj.__packageJson.data.version = proj.__versionPatchedPlusOne;
    proj.__packageJson.save('bump for patch release');
    //#endregion
  }
  //#endregion

  //#region getters & methods / create new version with tag for

  __createNewVersionWithTagForPathRelease(commitMsg?: string) {
    //#region @backendFunc
    const proj = this;
    let currentPathNum = proj.versionPathAsNumber; // + 1;
    let commitMessage = commitMsg ? commitMsg.trim() : ('new version ' + proj.version);
    proj.git.stageAllAndCommit(commitMessage);
    let tagName = `v${proj.version}`;

    while (true) {
      if (proj.git.checkTagExists(tagName)) {
        Helpers.warn(`[${config.frameworkName}] tag taken: ${tagName}.. looking for new...`);
        proj.__updateVersionPathRelease(++currentPathNum);
        tagName = `v${proj.__versionPatchedPlusOne}`;
        commitMessage = commitMsg ? commitMsg.trim() : ('new version ' + proj.__versionPatchedPlusOne);
        proj.git.stageAllAndCommit(commitMessage);
      } else {
        break;
      }
    }

    proj.run(`git tag -a ${tagName} `
      + `-m "${commitMessage}"`,
      { output: false }).sync();
    return { newVersion: proj.__versionPatchedPlusOne };
    //#endregion
  }
  //#endregion

  //#region getters & methods / get deps as project
  public __getDepsAsProject(type: Models.NpmDependencyType | Models.TnpNpmDependencyType,
    contextFolder?: string): Project[] {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return [];
    }
    return this.__getDepsAsPackage(type).map(packageObj => {
      let p = path.join(contextFolder ? contextFolder : this.location, config.folder.node_modules, packageObj.name);
      if (fse.existsSync(p)) {
        const project = Project.ins.From(p);
        return project;
      }
      // warn(`Dependency '${packageObj.name}' doen't exist in ${p}`)
    }).filter(f => !!f);
    //#endregion
  }
  //#endregion

  //#region getters & methods / get deps as package
  public __getDepsAsPackage(type: Models.NpmDependencyType | Models.TnpNpmDependencyType): Models.Package[] {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return [];
    }
    if (!this.__packageJson.data) {
      return [];
    }
    const isTnpOverridedDependency = (type === 'tnp_overrided_dependencies') &&
      this.__packageJson.data.tnp &&
      this.__packageJson.data.tnp.overrided &&
      this.__packageJson.data.tnp.overrided.dependencies;


    let installType: Models.InstalationType;

    let data: any;
    if (isTnpOverridedDependency) {
      data = this.__packageJson.data.tnp.overrided.dependencies
    } else {
      data = this.__packageJson.data[type];
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

      });
    //#endregion
  }
  //#endregion

  //#region getters & methods / check if ready for npm
  public __checkIfReadyForNpm(soft = false) {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return false;
    }

    if (this.__isSmartContainer) {
      return true;
    }

    // log('TYPEEEEE', this.type)
    const libs: CoreModels.LibType[] = ['isomorphic-lib', 'vscode-ext'];
    if (this.typeIsNot(...libs)) {
      if (soft) {
        return false;
      }
      Helpers.error(`This project '${chalk.bold(this.name)}' in ${this.location}

      isn't library type project (${libs.join(', ')}).`, false, true);
    }
    return true;
    //#endregion
  }
  //#endregion

  //#region getters & methods / get proxy projects
  __proxyProjFor(client: string, outFolder: 'dist'): Project {
    //#region @backendFunc
    return Project.ins.From(this.__getProxyProj(client, outFolder)) as any;
    //#endregion
  }
  //#endregion

  //#region getters & methods / get proxy project location
  __getProxyProj(client: string, outFolder: 'dist' = 'dist') {
    //#region @backendFunc
    const workspaceOrContainerProject: Project = this;
    return crossPlatformPath([workspaceOrContainerProject.location, outFolder, workspaceOrContainerProject.name, client]);
    //#endregion
  }
  //#endregion

  //#region getters & methods / get proxy ng projects
  private __getProxyNgProj(buildOptions: BuildOptions, type: 'app' | 'lib' = 'app'): Project {
    const project: Project = this;
    //#region @backendFunc
    const projepath = crossPlatformPath(path.join(this.location, project.__angularProjProxyPath(
      void 0, // TODO
      buildOptions.websql,
      type
    )));
    const proj = Project.ins.From(projepath);
    return proj as Project;
    //#endregion
  }
  //#endregion

  //#region getters & methods / angular proj proxy path
  public __angularProjProxyPath(
    client?: string,
    websql?: boolean,
    type: 'app' | 'lib' = 'app'
  ) {
    //#region @backendFunc
    const project = this;
    const pref = ((type === 'app') ? 'apps' : 'libs');
    const outFolder = config.folder.dist;

    const tmpProjectsStandalone = `tmp-${pref}-for-{{{outFolder}}}${websql ? '-websql' : ''}/${project.name}`;
    const tmpProjects = `tmp-${pref}-for-{{{outFolder}}}${websql ? '-websql' : ''}/${project.name}--for--{{{client}}}`;
    if (project.__isStandaloneProject) {
      if (outFolder) {
        return tmpProjectsStandalone.replace('{{{outFolder}}}', outFolder);
      }
      return tmpProjectsStandalone;
    }
    if (outFolder && client) {
      return tmpProjects.replace('{{{outFolder}}}', outFolder).replace('{{{client}}}', client);
    }
    return tmpProjects;
    //#endregion
  }
  //#endregion

  get __releaseCiProjectParent() {
    return Project.ins.From(this.__releaseCiProjectParentPath);
  }

  get __releaseCiProjectParentPath() {
    return (this.isInCiReleaseProject && (this.__isStandaloneProject || this.__isSmartContainer)) ?
      path.resolve(path.join(this.location,
        '..', // project
        '..', // dist
        '..', // tmp-dist-release
        '..' // location of base proj
      )) : void 0;
  }

  //#region getters & methods / releas pproject path
  get __releaseCiProjectPath() {
    //#region @backendFunc
    const absolutePathReleaseProject = this.pathFor([config.folder.tmpDistRelease, config.folder.dist, 'project', this.name]);
    return absolutePathReleaseProject;
    //#endregion
  }
  //#endregion

  //#region getters & methods / releas pproject path
  get releaseCiProject() {
    //#region @backendFunc
    return Project.ins.From(this.__releaseCiProjectPath);
    //#endregion
  }
  //#endregion


  //#region getters & methods / ignore from v3 framework version
  get __ignoreInV3() {
    //#region @backendFunc
    const files = [
      'angular.json.filetemplate',
      'ngsw-config.json.filetemplate',
    ];
    return [
      ...files,
      ...files.map(f => f.replace('.filetemplate', '')),
    ];
    //#endregion
  }
  //#endregion

  //#region getters & methods / start on command
  __startOnCommand(args: string) {
    //#region @backendFunc
    if (this.typeIs('isomorphic-lib')) {
      const command = `npm-run ts-node run.js ${args}`;
      return command;
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / build app
  async __buildApp(buildOptions: BuildOptions) {
    //#region @backend

    //#region prepare variables

    //#region prepare variables / baseHref

    const isSmartContainerTarget = this.__isSmartContainerTarget;
    const isSmartContainerTargetNonClient = this.__isSmartContainerTargetNonClient;

    let basename = ''
    if (this.isInCiReleaseProject) {
      if (!this.__env.config?.useDomain) {
        basename = `--base-href /${isSmartContainerTarget ? this.__smartContainerTargetParentContainer.name : this.name}/`;
        if (isSmartContainerTargetNonClient) {
          basename = `--base-href /${isSmartContainerTarget ? this.__smartContainerTargetParentContainer.name : this.name}/-/${this.name}/`;
        }
      }
    }

    //#endregion

    //#region prepare variables / webpack params
    let webpackEnvParams = `--env.outFolder=${buildOptions.outDir}`;
    webpackEnvParams = webpackEnvParams + (buildOptions.watch ? ' --env.watch=true' : '');


    const backAppTmpFolders = `../../`;
    const backeFromRelase = `../../../../`;
    const backeFromContainerTarget = `../../../`;
    let back = backAppTmpFolders;
    if (this.isInCiReleaseProject) {
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

    let outDirApp = this.isInCiReleaseProject ? config.folder.docs : `${buildOptions.outDir}-app${buildOptions.websql ? '-websql' : ''}`;
    if (isSmartContainerTargetNonClient) {
      outDirApp = `${outDirApp}/-/${this.name}`;
    }

    const outPutPathCommand = `--output-path ${back}${outDirApp} ${basename}`;

    //#endregion

    //#region prepare variables / general variables

    let portAssignedToAppBuild: number;

    if (!_.isNumber(portAssignedToAppBuild) || !portAssignedToAppBuild) {
      portAssignedToAppBuild = buildOptions.websql ? this.__standaloneWebsqlAppPort : this.__standaloneNormalAppPort;
    }

    if (!_.isNumber(portAssignedToAppBuild) || !portAssignedToAppBuild) {
      portAssignedToAppBuild = await this.assignFreePort(DEFAULT_PORT.APP_BUILD_LOCALHOST);
    }

    if (buildOptions.watch) {
      await Helpers.killProcessByPort(portAssignedToAppBuild);
    }


    const isStandalone = (this.__isStandaloneProject && !isSmartContainerTarget);

    const buildOutDir = buildOptions.outDir;
    const parent = (!isStandalone
      ? (isSmartContainerTarget ? this.__smartContainerTargetParentContainer : this.parent)
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

    //#region prepare variables / prepare angular command
    let angularBuildAppCmd: string;
    const portAssignedToAppBuildCommandPart = _.isNumber(portAssignedToAppBuild) ? `--port=${portAssignedToAppBuild}` : '';

    if (buildOptions.watch) {
      const isElectron = false;
      angularBuildAppCmd = `${this.__npmRunNg} serve ${isElectron ? 'angular-electron' : 'app'} `
        + ` ${portAssignedToAppBuildCommandPart} ${buildOptions.prod ? '--prod' : ''}`;

    } else {
      angularBuildAppCmd = `${this.__npmRunNg} build app`
        + `${buildOptions.prod ? '--configuration production' : ''} `
        + `${buildOptions.watch ? '--watch' : ''}`
        + `${outPutPathCommand} `;
    }
    //#endregion

    const angularTempProj = this.__getProxyNgProj(buildOptions);

    //#region prepare variables / angular info
    const showInfoAngular = () => {
      Helpers.log(`

  ANGULAR BUILD APP COMMAND: ${angularBuildAppCmd}

  inside: ${angularTempProj.location}

  `);
    };
    //#endregion

    //#endregion

    showInfoAngular();

    await angularTempProj.execute(angularBuildAppCmd, {
      resolvePromiseMsg: {
        stdout: 'Compiled successfully'
      },
      //#region command execute params
      exitOnErrorCallback: async (code) => {

        if (buildOptions.buildForRelease && !buildOptions.ci) {
          throw 'Angular compilation lib error!!!asd';
        } else {
          Helpers.error(`[${config.frameworkName}] Typescript compilation error (code=${code})`
            , false, true);
        }

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

  //#region getters & methods / show message when build lib done for smart container
  private __showMesageWhenBuildLibDoneForSmartContainer(buildOptions: BuildOptions) {
    //#region @backend
    if (this.isInCiReleaseProject) {
      Helpers.logInfo('Lib build part done...  ');
      return;
    }
    const buildLibDone = `LIB BUILD DONE.. `;
    const ifapp = 'if you want to start app build -> please run in other terminal command:';

    const ngserve = `${buildOptions.watch ? '--port 4201 # or whatever port' : '#'} to run angular ${buildOptions.watch
      ? 'ng serve'
      : 'ng build (for application - not lib)'
      }.`;
    // const bawOrba = buildOptions.watch ? 'baw' : 'ba';
    const bawOrbaLong = buildOptions.watch ? ' build:app:watch ' : ' build:app ';
    const bawOrbaLongWebsql = buildOptions.watch ? 'build:app:watch --websql' : 'build:app --websql';
    const withPort = '(with custom port - otherwise automatically selected)';
    const orIfWebsql = `or if you want to try websql mode:`;



    if (this.__isSmartContainerTarget) {
      const parent = this.__smartContainerTargetParentContainer;
      const target = buildOptions.smartContainerTargetName || this.__smartContainerBuildTarget.name;

      Helpers.taskDone(`${chalk.underline(`

      ${buildLibDone}... for target project "`
        + `${parent ? (parent.name + '/') : ''}${target}"`)}`)

      Helpers.success(`

      ${ifapp}

      ${chalk.bold(config.frameworkName + bawOrbaLong + target)}
      or
      ${config.frameworkName} ${bawOrbaLongWebsql} ${target}

            `);
    } else if (this.__isStandaloneProject) {
      Helpers.taskDone(`${chalk.underline(`${buildLibDone}...`)}`)
      Helpers.success(`

      ${ifapp}

      ${chalk.bold(config.frameworkName + bawOrbaLong)}
      or
      ${config.frameworkName} ${bawOrbaLongWebsql}
      `);
    }
    //#endregion
  }

  //#endregion

  //#region getters & methods / fix build dirs
  private __fixBuildDirs(outDir: 'dist') {
    //#region @backend
    const p = path.join(this.location, outDir);
    if (!Helpers.isFolder(p)) {
      Helpers.remove(p);
      Helpers.mkdirp(p);
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / include node_modules in compilation
  private __backendRemoveDts(outDir: 'dist') {
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

  //#region getters & methods / include node_modules in compilation
  private __backendIncludeNodeModulesInCompilation(outDir: 'dist', cliBuildUglify: boolean, mainCliJSFileName: string = config.file.index_js) {
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

    const nccComand = `ncc build ${outDir}/${config.file.index_js} -o ${outDir}/temp/ncc ${cliBuildUglify ? '-m' : ''}  --no-cache `;
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
    const pj: Models.IPackageJSON = Helpers.readJson(pjPath);
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

  //#region getters & methods / compile backend es5
  /**
   * TODO not working
   */
  private __backendCompileToEs5(outDir: 'dist', mainCliJSFileName = 'index.js') {
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

  //#region getters & methods / compile/cliBuildUglify backend code
  private __backendUglifyCode(outDir: 'dist', reservedNames: string[], mainCliJSFileName = 'index.js') {
    //#region @backendFunc
    if (!Helpers.exists(path.join(this.location, outDir, mainCliJSFileName))) {
      Helpers.warn(`[cliBuildUglifyCode] Nothing to cliBuildUglify... no ${mainCliJSFileName} in /${outDir}`)
      return
    }
    const command = `npm-run cliBuildUglifyjs ${outDir}/${mainCliJSFileName} --output ${outDir}/${mainCliJSFileName} -b`
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

  //#region getters & methods / compile/cliBuildObscure backend code
  private __backendObscureCode(outDir: 'dist', reservedNames: string[], mainCliJSFileName = 'index.js') {
    //#region @backendFunc
    if (!Helpers.exists(path.join(this.location, config.folder.dist, mainCliJSFileName))) {
      Helpers.warn(`[cliBuildObscureCode] Nothing to cliBuildObscure... no ${mainCliJSFileName} in release dist`)
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

  //#region getters & methods / cut release code
  private __restoreCuttedReleaseCodeFromSrc(buildOptions: BuildOptions) {
    //#region @backend
    const releaseSrcLocation = crossPlatformPath(path.join(this.location, config.folder.src));
    const releaseSrcLocationOrg = crossPlatformPath(path.join(this.location, buildOptions.temporarySrcForReleaseCutCode));

    Helpers.removeFolderIfExists(releaseSrcLocation);
    Helpers.copy(releaseSrcLocationOrg, releaseSrcLocation);

    //#endregion
  }
  private __cutReleaseCodeFromSrc(buildOptions: BuildOptions) {
    //#region @backend
    const releaseSrcLocation = crossPlatformPath(path.join(this.location, config.folder.src));
    const releaseSrcLocationOrg = crossPlatformPath(path.join(this.location, buildOptions.temporarySrcForReleaseCutCode));
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
          this,
        ).output;
        // rawContent = this.replaceRegionsWith(rawContent, ['@notFor'+'Npm']);
        Helpers.writeFile(absolutePath, rawContent);
      });
    //#endregion
  }
  //#endregion

  //#region getters & methods / init
  async init(initOptions?: InitOptions) {
    //#region @backendFunc
    this.__saveLaunchJson(4000);
    Helpers.removeIfExists(path.join(this.location, config.file.tnpEnvironment_json));
    initOptions = InitOptions.from(initOptions);
    await this.__filesStructure.init(initOptions);

    initOptions.finishCallback();
    //#endregion
  }
  //#endregion

  //#region getters & methods / struct
  async struct() {
    await this.init(InitOptions.from({ struct: true }));
  }
  //#endregion

  //#region getters & methods / get unexisted projects
  private async _cloneUnexistedProjects() {
    //#region @backendFunc
    const shouldBeProjectArr = this.__packageJson.linkedProjects
      .map(relativePath => {
        const possibleProjPath = crossPlatformPath(path.join(this.location, relativePath))
        let possibleProj = Project.ins.From(possibleProjPath) as Project;
        if (possibleProj) {
          return void 0;
        }
        if (Helpers.git.isInMergeProcess(possibleProjPath)) {
          Helpers.run('git reset --hard', { cwd: possibleProjPath }).sync();
        }
        possibleProj = Project.ins.From(possibleProjPath) as Project;
        if (possibleProj) {
          return void 0;
        }
        return relativePath;
      })
      .filter(f => !!f)
      .sort()

    if (shouldBeProjectArr.length > 0) {
      Helpers.pressKeyAndContinue(`

${shouldBeProjectArr.map((p, index) => `- ${index + 1}. ${p}`).join('\n')}

      press any key to clone each above project..`);
      for (let index = 0; index < shouldBeProjectArr.length; index++) {
        const relativePath = shouldBeProjectArr[index];
        const projectNameFromPackageJson = path.basename(relativePath);
        if (Helpers.isValidGitRepuUrl(relativePath)) {
          const p = path.join(this.location, relativePath);
          if (!Helpers.exists(p)) {
            await Helpers.actionWrapper(() => {
              this.git.clone(relativePath);
            }, `Cloning unexisted project from url ${chalk.bold(relativePath)}`);
          }
        } else {
          const ADDRESS_GITHUB_SSH = this.git.originURL;
          const githubGitUrl = this.__isSmartContainer
            ? ADDRESS_GITHUB_SSH.replace(`${this.name}.git`, `${this.name}--${projectNameFromPackageJson}.git`)
            : ADDRESS_GITHUB_SSH.replace(`${this.name}.git`, `${projectNameFromPackageJson}.git`);

          await Helpers.actionWrapper(() => {
            this.git.clone(githubGitUrl + ` ${projectNameFromPackageJson}`);
          }, `Cloning unexisted project ${chalk.bold(projectNameFromPackageJson)}`);
        }

      }
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods /  get linked projects and childrens
  private async _getLinkedPorjectsAndChildrens(): Promise<Project[]> {
    //#region @backendFunc
    if (this.__isMonorepo) {
      return [];
    }
    await this._cloneUnexistedProjects();

    let childrenToPush = [
      ...this.children.filter(c => {
        return this.__packageJson.linkedProjects.includes(c.name);
      }),
      ...(this.hasFile('taon.json') ? this.children : []),
      ... this.__linkedProjectsExisted,
    ];

    childrenToPush = childrenToPush.filter(f => !!f);

    return Helpers.arrays.uniqArray<Project>(childrenToPush, 'location') as any;
    //#endregion
  }
  //#endregion

  //#region getters & methods / before push action
  protected async _beforePushProcessAction() {
    //#region @backendFunc
    await super._beforePushProcessAction();

    if (!this.git.originURL && this.__isContainerChild && !this.__isSmartContainerChild) {
      this.run(`git remote add ${origin} ${this.parent.git
        .originURL.replace(this.parent.name, this.name)}`).sync()
    }

    this.removeFolderByRelativePath('node_modules/husky');

    if (this.name === 'morphi' || this.name === 'firedev-framework') {
      config.activeFramewrokVersions
        .forEach((frameworkVersion) => {
          // console.log(`Active Framework: ${frameworkVersion}`)
          const morphiProjectContainerPath = path.join(this.location, 'projects', `container${(frameworkVersion === 'v1') ? '' : `-${frameworkVersion}`}`);
          const containerCoreForVersion = Project.ins.From(morphiProjectContainerPath) as Project;
          if (containerCoreForVersion) {
            Helpers.info(`[${config.frameworkName}] updating on push global container${(frameworkVersion === 'v1') ? '' : `-${frameworkVersion}`} in ${this.name}`)
            containerCoreForVersion.__packageJson.save('Updating morphi container');
          } else {
            Helpers.warn(`[firedev][hotfix] Not able to find container for framework version ${frameworkVersion}`);
          }
        });
    }
    if (this.__targetProjects.exists) {
      Helpers.warn(`

      Don't forget to push target projects for project ${chalk.bold(this.name)}

      `);
    }
    //#endregion
  }
  //#endregion

  //#region getters & methods / before pull action
  protected async _beforePullProcessAction() {
    //#region @backendFunc
    // await Helpers.killAllNodeExceptCurrentProcess();
    //#endregion
  }
  //#endregion

  //#endregion
}

