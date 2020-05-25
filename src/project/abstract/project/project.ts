//#region @backend
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import * as json5 from 'json5';
export { ChildProcess } from 'child_process';
import { ChildProcess } from 'child_process';
import { Project as PorjectBase } from 'tnp-helpers/project';
//#endregion
import { config } from '../../../config';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';

import { Morphi, ModelDataConfig } from 'morphi';
import { BaseProject } from './base-project';
import { NpmProject } from './npm-project';
import { FeatureProject } from './feature-project';
import { TnpProject } from './tnp-project';
import { FolderProject } from './folder-project';
//#region @backend
import { LibProject } from './lib-project.backend';
import { ProjectGit } from './git-project.backend';
import { VscodeProject } from './vscode-project.backend';
import { StaticProject } from './static-project.backend';
import { RouterProject } from './router-project.backend';
import { RecreatableProject } from './recreatable-project.backend';
import { EntityProject } from './entity-projects.backend';
import { BuildableProject } from './buildable-project';
import { SiteProject } from './site-project.backend';
import { PackageJSON, QuickFixes, StaticBuild, WorkspaceSymlinks, TnpBundle, NpmPackages, NodeModules, FilesRecreator, FilesFactory, FilesTemplatesBuilder, TestRunner, EnvironmentConfig, ProxyRouter, FilesStructure, BuildProcess } from '../../features';
import { SourceModifier, FrameworkFilesGenerator, BaselineSiteJoin, OutputCodeModifier } from '../../compilers';
import { CopyManager } from '../../features/copy-manager';
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
export class Project extends PorjectBase<Project> {

  constructor(location?: string) {
    super();
    this.defineProperty('compilerCache', CompilerCache);
    this.cache = {};
    this.location = _.isString(location) ? location : '';
    this.packageJson = PackageJSON.fromProject(this);
    this.setType(this.packageJson ? this.packageJson.type : 'unknow');
    this.defineProperty('quickFixes', QuickFixes);
    // this.quickFixes = new QuickFixes(this)
    this.quickFixes.missingSourceFolders()
    this.defineProperty('staticBuild', StaticBuild);
    // this.staticBuild = new StaticBuild(this)
    this.defineProperty('workspaceSymlinks', WorkspaceSymlinks);
    // this.workspaceSymlinks = new WorkspaceSymlinks(this);
    this.defineProperty('tnpBundle', TnpBundle);
    // this.tnpBundle = new TnpBundle(this);
    this.defineProperty('node_modules', NodeModules);
    // this.node_modules = new NodeModules(this);
    this.defineProperty('npmPackages', NpmPackages);
    // this.npmPackages = new NpmPackages(this)
    this.defineProperty('recreate', FilesRecreator);
    // this.recreate = new FilesRecreator(this);
    this.defineProperty('filesFactory', FilesFactory);
    // this.filesFactory = new FilesFactory(this);
    this.defineProperty('sourceModifier', SourceModifier);
    // this.sourceModifier = new SourceModifier(this);

    // this.outputCodeModifier = new OutputCodeModifier(this); //  NOT USED
    this.defineProperty('frameworkFileGenerator', FrameworkFilesGenerator);
    // this.frameworkFileGenerator = new FrameworkFilesGenerator(this);
    this.defineProperty('filesTemplatesBuilder', FilesTemplatesBuilder);
    // this.filesTemplatesBuilder = new FilesTemplatesBuilder(this);
    this.defineProperty('join', BaselineSiteJoin);
    // this.join = new BaselineSiteJoin(this);
    this.defineProperty('tests', TestRunner);
    // this.tests = new TestRunner(this);

    Project.projects.push(this);

    // this.requiredLibs = this.packageJson.requiredProjects;


    this.__defaultPort = Project.DefaultPortByType(this._type);
    // log(`Default port by type ${this.name}, baseline ${this.baseline && this.baseline.name}`)

    if (this.isWorkspace || this.isWorkspaceChildProject || this.isStandaloneProject) {
      // this.defineProperty('env', EnvironmentConfig);
      this.env = new EnvironmentConfig(this) as any;
    }

    if (this.isWorkspace || this.isWorkspaceChildProject) {
      this.defineProperty('proxyRouter', ProxyRouter);
      // this.proxyRouter = new ProxyRouter(this);
    }
    this.copyManager = new CopyManager(this);
    if (this.isStandaloneProject && this.packageJson) {
      this.packageJson.updateHooks()
    }
    this.defineProperty('filesStructure', FilesStructure);
    // this.filesStructure = new FilesStructure(this);
    this.defineProperty('buildProcess', BuildProcess);
    // this.buildProcess = new BuildProcess(this);

    this.notAllowedFiles().forEach(f => {
      Helpers.removeFileIfExists(path.join(this.location, f));
    });
  }
  //#endregion

}

// @ts-ignore
export interface Project extends
  BaseProject,
  NpmProject,
  FeatureProject,
  TnpProject,
  FolderProject
  //#region @backend
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
  CompilerCache
//#endregion
{

}

Helpers.applyMixins(Project, [
  BaseProject,
  NpmProject,
  FeatureProject,
  TnpProject,
  FolderProject,
  //#region @backend
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
  //#endregion
])

