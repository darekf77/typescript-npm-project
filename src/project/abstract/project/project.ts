//#region @backend
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import * as json5 from 'json5';
export { ChildProcess } from 'child_process';
import { ChildProcess } from 'child_process';
//#endregion
import { Project as $Project } from 'tnp-helpers';
import { config } from '../../../config';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';

import { Morphi, ModelDataConfig } from 'morphi';
//#region @backend
import { BaseProject } from './base-project';
import { NpmProject } from './npm-project';
import { FeatureProject } from './feature-project';
import { TnpProject } from './tnp-project';
import { FolderProject } from './folder-project';
import { LibProject } from './lib-project.backend';
import { VscodeProject } from './vscode-project.backend';
import { StaticProject } from './static-project.backend';
import { RouterProject } from './router-project.backend';
import { RecreatableProject } from './recreatable-project.backend';
import { EntityProject } from './entity-projects.backend';
import { BuildableProject } from './buildable-project';
import { SiteProject } from './site-project.backend';
import {
  PackageJSON, QuickFixes, StaticBuild, WorkspaceSymlinks,
  TnpBundle, NpmPackages, NodeModules, FilesRecreator, FilesFactory,
  FilesTemplatesBuilder, TestRunner, EnvironmentConfig, ProxyRouter, FilesStructure, BuildProcess
} from '../../features';
import { SourceModifier, FrameworkFilesGenerator, BaselineSiteJoin } from '../../compilers';
import { CopyManager } from '../../features/copy-manager.backend';
import { DbProcessProject } from './db-process-project.backend';
import { DependencyProject } from './dependency-project.backend';
import { CompilerCache } from '../../features/compiler-cache.backend';
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
  browserTransformFn: (entity: Project, mdc: ModelDataConfig) => {
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
    entity.browser.isWorkspace = entity.isWorkspace;
    entity.browser.isStandaloneProject = entity.isStandaloneProject;
    entity.browser.isContainer = entity.isContainer;

  }
  //#endregion
} as any)
export class Project extends $Project<Project>
{
  browser: any;
  location: string;

  get info(this: Project) {
    if (Morphi.IsBrowser) {
      // @ts-ignore
      return this.browser.info;
    }
    //#region @backend
    return `(${this._type}) ${this.genericName}`;
    //#endregion
  }


  get TnpProject() {
    return Project.Tnp as Project;
  }

  get CurrentProject() {
    return Project.Current as Project;
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
    this.location = _.isString(location) ? location : '';
    if (!global.codePurposeBrowser) {
      this.defineProperty('compilerCache', CompilerCache);
      this.cache = {};
      this.packageJson = PackageJSON.fromProject(this);
      this.setType(this.packageJson ? this.packageJson.type : 'unknow');
      this.defineProperty<Project>('quickFixes', QuickFixes);
      this.defineProperty<Project>('staticBuild', StaticBuild);
      this.defineProperty<Project>('workspaceSymlinks', WorkspaceSymlinks);
      this.defineProperty<Project>('tnpBundle', TnpBundle);
      this.defineProperty<Project>('node_modules', NodeModules);
      this.defineProperty<Project>('npmPackages', NpmPackages);
      this.defineProperty<Project>('recreate', FilesRecreator);
      this.defineProperty<Project>('filesFactory', FilesFactory);
      this.defineProperty<Project>('sourceModifier', SourceModifier);
      this.defineProperty<Project>('frameworkFileGenerator', FrameworkFilesGenerator);
      this.defineProperty<Project>('filesTemplatesBuilder', FilesTemplatesBuilder);
      this.defineProperty<Project>('join', BaselineSiteJoin);
      this.defineProperty<Project>('tests', TestRunner);
      Project.projects.push(this);
      this.__defaultPort = Project.DefaultPortByType(this._type);
      this.defineProperty<Project>('env', EnvironmentConfig);
      this.defineProperty<Project>('proxyRouter', ProxyRouter);
      this.defineProperty<Project>('copyManager', CopyManager);
      this.defineProperty<Project>('filesStructure', FilesStructure);
      this.defineProperty<Project>('buildProcess', BuildProcess);
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
  FolderProject

  ,
  LibProject,
  VscodeProject,
  TnpProject,
  StaticProject,
  RouterProject,
  RecreatableProject,
  EntityProject,
  BuildableProject,
  SiteProject,
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

  LibProject,
  VscodeProject,

  StaticProject,
  RouterProject,
  RecreatableProject,
  EntityProject,
  BuildableProject,
  SiteProject,
  DbProcessProject,
  DependencyProject,
  CompilerCache
])
 //#endregion
