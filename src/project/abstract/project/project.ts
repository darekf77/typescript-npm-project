//#region @backend
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import * as json5 from 'json5';
export { ChildProcess } from 'child_process';
import { ChildProcess } from 'child_process';
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
export class Project {
  public static projects: Project[] = [];
  /**
   * To speed up checking folder I am keeping pathes for alterdy checked folder
   * This may break things that are creating new projects
   */
  public static emptyLocations: string[] = [];
  //#region @backend
  @Morphi.Orm.Column.Primary({ type: 'varchar', length: 400 })
  //#endregion
  public readonly location: string;

  //#region @backend
  private static typeFrom(location: string): Models.libs.LibType {
    if (!fse.existsSync(location)) {
      return void 0;
    }
    const packageJson = PackageJSON.fromLocation(location);
    const type = packageJson.type;
    return type;
  }
  //#endregion

  //#region @backend
  public static From(location: string): Project {

    if (!_.isString(location)) {
      Helpers.warn(`[project.from] location is not a string`)
      return;
    }
    location = path.resolve(location);
    if (Project.emptyLocations.includes(location)) {
      // Helpers.log(`[project.from] empty location ${location}`)
      return;
    }

    const alreadyExist = Project.projects.find(l => l.location.trim() === location.trim());
    if (alreadyExist) {
      return alreadyExist;
    }
    if (!fse.existsSync(location)) {
      Helpers.log(`[project.from] Cannot find project in location: ${location}`);
      Project.emptyLocations.push(location);
      return;
    }
    if (!PackageJSON.fromLocation(location)) {
      Helpers.log(`[project.from] Cannot find package.json in location: ${location}`, 1);
      Project.emptyLocations.push(location);
      return;
    };
    const type = this.typeFrom(location);

    // console.log(`TYpe "${type}" for ${location} `)
    let resultProject: Project;
    if (type === 'isomorphic-lib') {
      const { ProjectIsomorphicLib } = require('../../project-specyfic/project-isomorphic-lib');
      resultProject = new ProjectIsomorphicLib(location);
    }
    if (type === 'angular-lib') {
      const { ProjectAngularLib } = require('../../project-specyfic/project-angular-lib')
      resultProject = new ProjectAngularLib(location);
    }
    if (type === 'angular-client') {
      const { ProjectAngularClient } = require('../../project-specyfic/project-angular-client');
      resultProject = new ProjectAngularClient(location);
    }
    if (type === 'workspace') {
      const { ProjectWorkspace } = require('../../project-specyfic/project-workspace');
      resultProject = new ProjectWorkspace(location);
    }
    if (type === 'docker') {
      const { ProjectDocker } = require('../../project-specyfic/project-docker');
      resultProject = new ProjectDocker(location);
    }
    if (type === 'ionic-client') {
      const { ProjectIonicClient } = require('../../project-specyfic/project-ionic-client');
      resultProject = new ProjectIonicClient(location);
    }
    if (type === 'container') {
      const { ProjectContainer } = require('../../project-specyfic/project-container');
      resultProject = new ProjectContainer(location);
    }
    if (type === 'unknow-npm-project') {
      const { ProjectUnknowNpm } = require('../../project-specyfic/project-unknow-npm');
      resultProject = new ProjectUnknowNpm(location);
    }

    // log(resultProject ? (`PROJECT ${resultProject.type} in ${location}`)
    //     : ('NO PROJECT FROM LOCATION ' + location))

    Helpers.log(`[project.from] ${chalk.bold(resultProject.name)} from ...${location.substr(location.length - 100)}`, 1)
    return resultProject;
  }
  //#endregion

  //#region @backend
  public static nearestTo(absoluteLocation: string, options?: { type?: Models.libs.LibType; findGitRoot?: boolean; }) {
    options = options || {};
    const { type, findGitRoot } = options;

    if (_.isString(type) && !Models.libs.LibTypeArr.includes(type)) {
      Helpers.error(`[nearestTo] wrong type: ${type}`, false, true)
    }
    if (fse.existsSync(absoluteLocation)) {
      absoluteLocation = fse.realpathSync(absoluteLocation)
    }
    if (fse.existsSync(absoluteLocation) && !fse.lstatSync(absoluteLocation).isDirectory()) {
      absoluteLocation = path.dirname(absoluteLocation)
    }
    let project: Project;
    let previousLocation: string;
    while (true) {
      project = Project.From(absoluteLocation);
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
      absoluteLocation = path.resolve(newAbsLocation);
      if (!fse.existsSync(absoluteLocation)) {
        return;
      }
      if (previousLocation === absoluteLocation) {
        return;
      }
    }
    return project;
  }
  //#endregion


  public static DefaultPortByType(type: Models.libs.LibType): number {
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
    if (Helpers.isBrowser) {
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
      Helpers.error(`Current location is not a ${chalk.bold('tnp')} type project.

      location: "${process.cwd()}"

      }`, false, false);
    }
    // log('CURRENT', current.location)
    return current;
  }
  //#endregion

  //#region @backend
  static get Tnp() {

    let frameworkLocation = Project.From(config.pathes.tnp_folder_location);
    if (frameworkLocation) {
      const currentPathInSystem = path.join(frameworkLocation.location, config.file.tnp_system_path_txt);
      if (!fse.existsSync(currentPathInSystem)) {
        Helpers.writeFile(currentPathInSystem, frameworkLocation.location)
      }
    } else {
      let tnpBundleTnpPath;
      if (global.tnp_normal_mode) {
        tnpBundleTnpPath = Helpers.readFile(config.pathes.tnp_system_path_txt).toString().trim()
      } else {
        tnpBundleTnpPath = Helpers.readFile(config.pathes.tnp_system_path_txt_tnp_bundle).toString().trim()
      }
      if (!fse.existsSync(tnpBundleTnpPath)) {
        Helpers.error(`Please build you ${chalk.bold('tnp-npm-project')} first... `)
      }
      frameworkLocation = Project.From(tnpBundleTnpPath)
    }
    return frameworkLocation;
  }
  //#endregion

  //#region @backend
  public static by(libraryType: Models.libs.NewFactoryType, version: Models.libs.FrameworkVersion = config.defaultFrameworkVersion): Project {

    if (libraryType === 'workspace') {
      const workspaceProject = Project.From(config.pathes.projectsExamples(version).workspace);
      return workspaceProject;
    }
    if (libraryType === 'container') {
      const containerProject = Project.From(config.pathes.projectsExamples(version).container);
      return containerProject;
    }

    if (libraryType === 'single-file-project') {
      const singleFileProject = Project.From(config.pathes.projectsExamples(version).singlefileproject);
      return singleFileProject;
    }

    const projectPath = path.join(config.pathes.projectsExamples(version).projectByType(libraryType));
    if (!fse.existsSync(projectPath)) {
      Helpers.error(`Bad library type: ${libraryType} for this framework version: ${version}`, false, true);
    }
    return Project.From(projectPath);
  }
  //#endregion

  //#region @backend

  defineProperty(variableName: string, classFn: Function) {
    const that = this;
    const prefixedName = `__${variableName}`
    Object.defineProperty(this, variableName, {
      get: function () {
        if (!that[prefixedName]) {
          that[prefixedName] = new (classFn as any)(that);
        }
        return that[prefixedName];
      },
      set: function (v) {
        that[prefixedName] = v;
      },
    })
  }

  constructor(location?: string) {

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
      this.env = new EnvironmentConfig(this);
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
  ProjectGit,
  TnpProject,
  StaticProject,
  RouterProject,
  RecreatableProject,
  EntityProject,
  BuildableProject,
  SiteProject,
  DbProcessProject
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
  ProjectGit,

  StaticProject,
  RouterProject,
  RecreatableProject,
  EntityProject,
  BuildableProject,
  SiteProject,
  DbProcessProject
  //#endregion
])
