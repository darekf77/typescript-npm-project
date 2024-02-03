//#region imports
//#region @backend
import chalk from 'chalk';
import { fse } from 'tnp-core/src'
import { path } from 'tnp-core/src'
import { _, crossPlatformPath } from 'tnp-core/src';
import * as json5 from 'json5';
export { ChildProcess } from 'child_process';
import { ChildProcess } from 'child_process';
//#endregion
import { Project as $Project } from 'tnp-helpers/src';
import { config, ConfigModels } from 'tnp-config/src';
import { Models } from 'tnp-models/src';
import { Helpers } from 'tnp-helpers/src';

import { Morphi } from 'morphi/src';
//#region @backend
import { BaseProject } from './base-project';
import { NpmProject } from './npm-project';
import { FeatureProject } from './feature-project';
import { TnpProject } from './tnp-project';
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
import { SourceModifier, FrameworkFilesGenerator, AssetsFileListGenerator } from '../../compilers';
import { CopyManager } from '../../features/copy-manager';
import { DbProcessProject } from './db-process-project.backend';
import { DependencyProject } from './dependency-project.backend';
import { CompilerCache } from '../../features/compiler-cache.backend';
import { SmartNodeModules } from '../../features/smart-node-modules.backend';
import { RecentFilesForContainer } from '../../features/recent-files.backend';
import { CloudProject } from './cloud-project';
import { GlobalWorkerApps } from '../../features/global-worker-apps';
import { InsideStructures } from '../../features/inside-structures/inside-structures';
import { SingularBuild } from '../../features/singular-build.backend';
import { CLASS } from 'typescript-class-helpers/src';
import { PortUtils } from '../../../constants';
//#endregion
//#endregion

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
  browserTransformFn: (entity: Project, mdc: any) => {
    // log('I AM TRANSFORMING ENTITY!!!', mdc)
    let exclude = [];
    if (!entity.browser) {
      entity.browser = {} as any;
    }
    if (!!mdc && mdc.exclude.length > 0) {
      exclude = mdc.exclude;
    }
    // if(exclude.length > 0) {
    //   log('exclude in Project', exclude)
    // }

    if (!(exclude.length > 0 && exclude.includes('children'))) {
      // log('SET CHILDREND')
      entity.browser.children = entity.children as any;
    } else {
      entity.browser.children = void 0
    }

    if (!(exclude.length > 0 && exclude.includes('parent'))) {
      entity.browser.parent = entity.parent as any;
    } else {
      entity.browser.parent = void 0
    }

    entity.browser.genericName = entity.genericName;
    entity.browser.name = entity.name;
    entity.browser.isStandaloneProject = entity.isStandaloneProject;
    entity.browser.isContainer = entity.isContainer;

  }
  //#endregion
} as any) // @ts-ignore
export class Project extends $Project<Project>
{
  //#region @backend
  env?: EnvironmentConfig;
  //#endregion
  browser: any;

  private _projectInfoPort: number;

  setProjectInfoPort(v) {
    //#region @backend
    this._projectInfoPort = v;
    for (const child of this.children) {
      child.setProjectInfoPort(v);
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

  location: string;

  //#region @backend
  static angularMajorVersionForCurrentCli(): number {
    const tnp = (Project.Tnp as Project);
    const angularFrameworkVersion = Number(_.first(tnp.version.replace('v', '').split('.')));
    return angularFrameworkVersion;
  }
  //#endregion

  //#region @backend
  static morphiTagToCheckoutForCurrentCliVersion(cwd: string): string {
    const ngVer = Project.angularMajorVersionForCurrentCli();
    const lastTagForVer = (Project.From(cwd) as Project).git.lastTagNameForMajorVersion(ngVer);
    return lastTagForVer;
  }
  //#endregion


  get info(
    //#region @backend
    // @ts-ignore
    this: Project
    //#endregion
  ) {
    if (Morphi.IsBrowser) {
      return this.browser.info as any;
    }
    //#region @backend
    return `(${this._type}) ${this.genericName} `;
    //#endregion
  }

  get TnpProject() {
    return Project.Tnp as Project;
  }

  get isBundleMode() {
    return Project.isBundleMode;
  }

  removeItself(this: Project) {
    //#region @backend
    const location = this.location;
    Project.projects = Project.projects.filter(p => p.location !== location);
    Helpers.tryRemoveDir(location);
    //#endregion
  }

  //#region @backend
  /**
   * DO NOT USE function isWorkspace, isWOrkspace child.. it is to expensive
   */
  constructor(location?: string) {
    super();
    this.location = crossPlatformPath(_.isString(location) ? location : '');
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
      this.defineProperty<Project>('sourceModifier', SourceModifier);
      this.defineProperty<Project>('frameworkFileGenerator', FrameworkFilesGenerator);
      this.defineProperty<Project>('filesTemplatesBuilder', FilesTemplatesBuilder);
      // console.log({
      //   MochaTestRunner, JestTestRunner, CypressTestRunner,
      // })
      this.defineProperty<Project>('tests', MochaTestRunner);
      this.defineProperty<Project>('testsJest', JestTestRunner);
      this.defineProperty<Project>('testsCypress', CypressTestRunner);
      Project.projects.push(this);
      this.defineProperty<Project>('env', EnvironmentConfig);
      this.defineProperty<Project>('copyManager', CopyManager);
      this.defineProperty<Project>('filesStructure', FilesStructure);
      this.defineProperty<Project>('buildProcess', BuildProcessFeature);
      this.defineProperty<Project>('targetProjects', TargetProject);
      this.defineProperty<Project>('gitActions', GitActions);
      this.defineProperty<Project>('smartNodeModules', SmartNodeModules);
      this.defineProperty<Project>('recent', RecentFilesForContainer);
      this.defineProperty<Project>('workerApps', GlobalWorkerApps);
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

//#region @backend
// @ts-ignore
export interface Project extends
  BaseProject,
  NpmProject,
  FeatureProject,
  TnpProject,
  FolderProject,
  CloudProject
  ,
  LibProject,
  VscodeProject,
  TnpProject,
  RecreatableProject,
  EntityProject,
  BuildableProject,
  ElectronProject,
  DbProcessProject,
  DependencyProject,
  CompilerCache {

}
//#endregion

//#region @backend
Helpers.applyMixins(Project, [
  BaseProject,
  NpmProject,
  FeatureProject,
  TnpProject,
  FolderProject,
  CloudProject,

  LibProject,
  VscodeProject,

  RecreatableProject,
  EntityProject,
  BuildableProject,
  ElectronProject,
  DbProcessProject,
  DependencyProject,
  CompilerCache
])
 //#endregion
