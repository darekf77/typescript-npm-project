//#region @backend
import chalk from 'chalk';
import * as fs from 'fs';
import * as rimraf from 'rimraf';

import * as fse from "fs-extra";
import * as path from 'path';
import * as _ from 'lodash';
import * as inquirer from 'inquirer';
export { ChildProcess } from 'child_process';
import { ChildProcess } from "child_process";

import config from '../../config';
import { RecreateFile, RunOptions, Package, BuildDir, EnvConfig, IPackageJSON, IProject } from '../../models';
import {
  error, info, warn, run as __run, watcher as __watcher, killProcessByPort,
  pullCurrentBranch, countCommits, lastCommitDate, lastCommitHash, currentBranchName, log
} from '../../helpers';
import { NodeModules } from "../features/node-modules";
import { FilesRecreator } from '../features/files-builder';
import { ProxyRouter } from '../features/proxy-router';
import { CopyManager } from '../features/copy-manager';
import { SourceModifier } from '../features/source-modifier';
import { FrameworkFilesGenerator } from '../features/framework-files-generator';

//#endregion

import { Morphi, ModelDataConfig } from 'morphi';

import { LibType, EnvironmentName, NpmDependencyType } from '../../models';
import { PackageJSON } from "../features/package-json";
import { EnvironmentConfig } from '../features/environment-config';
import { TestRunner } from '../features/test-runner';
import { BuildOptions } from '../features/build-options';
import { NpmPackages } from '../features/npm-packages';
import { BaselineSiteJoin } from '../features/baseline-site-join';
import { BaseProject } from './base-project';
import { TnpBundle } from '../features/tnp-bundle';
import { StaticBuild } from '../features/static-build';
import { Initialization } from '../features/initialization';
import { AutoActions } from '../features/auto-actions';
import { BuildProcess } from '../features/build-proces';


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
export class Project extends BaseProject implements IProject {
  public static projects: Project[] = [];
  //#region @backend
  @Morphi.Orm.Column.Primary({ type: 'varchar', length: 400 })
  //#endregion
  public readonly location: string;

  private static typeFrom(location: string): LibType {
    const packageJson = PackageJSON.fromLocation(location);
    const type = packageJson.type;
    return type;
  }

  public static From(location: string): Project {

    if (!_.isString(location)) {
      warn(`[project.from] location is not a string`)
      return;
    }
    location = path.resolve(location);

    const alreadyExist = Project.projects.find(l => l.location.trim() === location.trim());
    if (alreadyExist) {
      return alreadyExist;
    }
    if (!fs.existsSync(location)) {
      warn(`[project.from] Cannot find project in location: ${location}`)
      return;
    }
    if (!PackageJSON.fromLocation(location)) {
      warn(`[project.from] Cannot find package.json in location: ${location}`)
      return;
    };
    const type = this.typeFrom(location);

    let resultProject: Project;
    if (type === 'isomorphic-lib') {
      const ProjectIsomorphicLib = require('./project-isomorphic-lib');
      resultProject = new ProjectIsomorphicLib(location);
    }
    if (type === 'angular-lib') {
      const ProjectAngularLib = require('./project-angular-lib')
      resultProject = new ProjectAngularLib(location);
    }
    if (type === 'angular-client') {
      const ProjectAngularClient = require('./project-angular-client');
      resultProject = new ProjectAngularClient(location);
    }
    if (type === 'workspace') {
      const ProjectWorkspace = require('./project-workspace');
      resultProject = new ProjectWorkspace(location);
    }
    if (type === 'docker') {
      const ProjectDocker = require('./project-docker');
      resultProject = new ProjectDocker(location);
    }
    if (type === 'ionic-client') {
      const ProjectIonicClient = require('./project-ionic-client');
      resultProject = new ProjectIonicClient(location);
    }
    if (type === 'unknow-npm-project') {
      const UnknowNpmProject = require('./project-unknow-npm');
      resultProject = new UnknowNpmProject(location);
    }
    if (type === 'container') {
      const ProjectContainer = require('./project-container');
      resultProject = new ProjectContainer(location);
    }
    // console.log(resultProject ? (`PROJECT ${resultProject.type} in ${location}`)
    //     : ('NO PROJECT FROM LOCATION ' + location))

    log(`Result project: ${resultProject.name}`)
    return resultProject;
  }

  public static nearestTo(location: string) {
    // console.log('nearestPorjectLocaiont', location)
    const project = this.From(location);
    if (project) {
      return project;
    }
    location = path.join(location, '..');
    if (!fs.existsSync(location)) {
      return void 0;
    }
    return this.From(path.resolve(location));
  }

  public static defaultPortByType(type: LibType): number {
    if (type === 'workspace') { return 5000; }
    if (type === 'angular-client') { return 4300; }
    if (type === 'angular-lib') { return 4250; }
    if (type === 'ionic-client') { return 8080; }
    if (type === 'docker') { return 5000; }
    if (type === 'isomorphic-lib') { return 4000; }
    error(`[project] Cannot resove type for: ${type}`);
  }

  public static get isBundleMode() {
    if (Morphi.IsBrowser) {
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
      error(`Current location is not a ${chalk.bold('tnp')} type project.\n\n${process.cwd()}`, false, true)
    }
    // console.log('CURRENT', current.location)
    return current;
  }
  //#endregion

  //#region @backend
  static get Tnp() {

    const filenameapth = 'tnp-system-path.txt';
    let tnp = Project.From(path.join(__dirname, '..', '..'));
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
      tnp = Project.From(tnpBundleTnpPath)
    }
    return tnp;
  }
  //#endregion

  //#region @backend
  public static by(libraryType: LibType): Project {

    // console.log('by libraryType ' + libraryType)
    let projectPath;
    if (libraryType === 'workspace') {
      let p = Project.From(path.join(__dirname, `../../projects/container/workspace`));
      if (!p) {
        p = Project.From(path.join(__dirname, `../projects/container/workspace`));
      }
      return p;
    }
    projectPath = path.join(__dirname, `../../projects/container/workspace/${libraryType}`);
    if (fse.existsSync(projectPath)) {
      return Project.From(projectPath);
    }
    projectPath = path.join(__dirname, `../projects/container/workspace/${libraryType}`);
    if (!fs.existsSync(projectPath)) {
      error(`Bad library type: ${libraryType}`, true)
      return undefined;
    }
    return Project.From(projectPath);
  }
  //#endregion

  //#region @backend
  constructor(location?: string) {
    super()

    if (!_.isUndefined(location)) {


      this.location = location;

      if (fs.existsSync(location)) {

        // console.log('PROJECT FROM', location)


        this.packageJson = PackageJSON.fromProject(this);
        this.staticBuild = new StaticBuild(this)
        this.tnpBundle = new TnpBundle(this);
        this.node_modules = new NodeModules(this);
        this.type = this.packageJson.type;
        this.npmPackages = new NpmPackages(this)
        this.recreate = new FilesRecreator(this);
        this.sourceModifier = new SourceModifier(this);
        this.frameworkFileGenerator = new FrameworkFilesGenerator(this)
        this.autoActions = new AutoActions(this);
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
        this.copyManager = new CopyManager(this);
        if (this.isStandaloneProject) {
          this.packageJson.updateHooks()
        }
        this.init = new Initialization(this);
        this.buildProcess = new BuildProcess(this);
      } else {
        warn(`Invalid project location: ${location}`);
      }
    }
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


}
