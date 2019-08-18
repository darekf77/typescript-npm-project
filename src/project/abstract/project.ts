//#region @backend
import chalk from 'chalk';
import * as fs from 'fs';
import * as fse from "fs-extra";
import * as path from 'path';
import * as _ from 'lodash';
import * as inquirer from 'inquirer';
import * as rimraf from 'rimraf';
export { ChildProcess } from 'child_process';
import { ChildProcess } from "child_process";

import config from '../../config';
import { RecreateFile, RunOptions, Package, BuildDir, EnvConfig, IPackageJSON, InstalationType, TnpNpmDependencyType, ArrNpmDependencyType, LibTypeArr } from '../../models';
import {
  error, info, warn, run as __run, watcher as __watcher, killProcessByPort,
  pullCurrentBranch, countCommits, lastCommitDate, lastCommitHash, currentBranchName, log, tryRemoveDir, HelpersLinks
} from '../../helpers';
import { NodeModules } from "../features/node-modules";
import { FilesRecreator } from '../features/files-recreator';
import { ProxyRouter } from '../features/proxy-router';
import { CopyManager } from '../features/copy-manager';
import { SourceModifier } from '../features/source-modifier';
import { TestRunner } from '../features/test-runner';
import { BuildOptions } from '../features/build-options';
import { NpmPackages } from '../features/npm-packages';
import { BaselineSiteJoin } from '../features/baseline-site-join';
import { TnpBundle } from '../features/tnp-bundle';
import { FilesStructure } from '../features/files-structure';
import { BuildProcess } from '../features/build-proces';
import { FrameworkFilesGenerator } from '../features/framework-files-generator';
import { FilesTemplatesBuilder } from '../features/files-templates';
import { WorkspaceSymlinks } from '../features/workspace-symlinks';
import { TnpDB } from '../../tnp-db';
import { FilesFactory } from '../features/files-factory.backend';
import { PackagesRecognitionExtended } from '../features/packages-recognition-extended';
import { StaticBuild } from '../features/static-build';
import { QuickFixes } from '../features/quick-fixes';
import { config as configMorphi } from 'morphi/build/config';
import { FILE_NAME_ISOMORPHIC_PACKAGES } from 'morphi/build/packages-recognition';
//#endregion

import { Morphi, ModelDataConfig } from 'morphi';
import { EnvironmentConfig } from '../features/environment-config';
import { PackageJSON } from '../features/package-json';
import { LibType, EnvironmentName, NpmDependencyType, IProject } from '../../models';
import * as json5 from 'json5';







export abstract class BaseProject {

  handleModyfications(relativeFilePath: string) {

  }

  abstract location: string;
  //#region @backend
  protected __defaultPort: number;
  //#endregion

  //#region @backend
  protected buildOptions?: BuildOptions;
  //#endregion
  modelDataConfig?: ModelDataConfig;
  id: number;

  public type: LibType;

  browser: IProject = {} as any;

  //#region @backend
  tests: TestRunner;
  //#endregion

  public packageJson: PackageJSON;

  //#region @backend
  public tnpBundle: TnpBundle;
  //#endregion

  //#region @backend
  public filesStructure: FilesStructure;
  //#endregion

  //#region @backend
  public filesTemplatesBuilder: FilesTemplatesBuilder;
  //#endregion

  //#region @backend
  public buildProcess: BuildProcess;
  //#endregion

  //#region @backend
  public workspaceSymlinks: WorkspaceSymlinks;
  //#endregion

  //#region @backend
  public node_modules: NodeModules;
  //#endregion

  //#region @backend
  public recreate: FilesRecreator;
  //#endregion

  //#region @backend
  public filesFactory: FilesFactory;
  //#endregion


  //#region @backend
  public join: BaselineSiteJoin;
  //#endregion

  //#region @backend
  public sourceModifier: SourceModifier;
  //#endregion

  //#region @backend
  public quickFixes: QuickFixes;
  //#endregion

  //#region @backend
  public frameworkFileGenerator: FrameworkFilesGenerator;
  //#endregion

  //#region @backend
  public npmPackages: NpmPackages;
  //#endregion

  env: EnvironmentConfig;

  //#region @backend
  public proxyRouter: ProxyRouter;
  //#endregion

  //#region @backend
  public copyManager: CopyManager;
  //#endregion

  //#region @backend
  public staticBuild: StaticBuild;
  //#endregion

  public get genericName(): string {
    if (Morphi.IsBrowser) {
      return this.browser.genericName;
    }
    //#region @backendFunc
    return [
      (this.isGenerated ? `((${chalk.bold('GENERATED')}))` : ''),
      ((this.isWorkspaceChildProject && this.parent.isContainerChild) ? this.parent.parent.name : ''),
      (this.isWorkspaceChildProject ? this.parent.name : ''),
      (this.isContainerChild ? this.parent.name : ''),
      ((this.isStandaloneProject && this.parent && this.parent.name) ? `<<${this.parent.genericName}>>` : ''),
      this.name
    ].filter(f => !!f).join('/').trim()
    //#endregion
  }


  public get name(): string {
    if (Morphi.IsBrowser) {
      return this.browser.name;
    }
    //#region @backendFunc
    if (this.packageJson && this.type === 'unknow-npm-project') {
      if (this.packageJson.name !== path.basename(this.location)
        && path.basename(path.dirname(this.location)) === 'external') {
        return path.basename(this.location);
      }
    }
    return this.packageJson ? this.packageJson.name : path.basename(this.location);
    //#endregion
  }

  public get backupName() {
    if (Morphi.IsBrowser) {
      return this.browser.backupName;
    }
    //#region @backend
    return `tmp-${this.name}`
    //#endregion
  }

  //#region @backend
  get hasNpmOrganization() {
    // log('path.dirname(this.location)', path.dirname(this.location))
    return path.basename(path.dirname(this.location)).startsWith('@');
  }

  get npmOrganization() {
    if (!this.hasNpmOrganization) {
      return;
    }
    return path.basename(path.dirname(this.location))
  }
  //#endregion

  get isForRecreation() {
    if (Morphi.IsBrowser) {
      return this.browser.isForRecreation;
    }
    //#region @backend
    return (this.isWorkspaceChildProject || this.isWorkspace || this.isContainer);
    //#endregion
  }

  get isWorkspace() {
    if (Morphi.IsBrowser) {
      return this.browser.isWorkspace;
    }
    //#region @backend
    return this.type === 'workspace';
    //#endregion
  }

  get isContainer() {
    if (Morphi.IsBrowser) {
      return this.browser.isContainer;
    }
    //#region @backend
    return this.type === 'container';
    //#endregion
  }

  get isContainerChild() {
    if (Morphi.IsBrowser) {
      return this.browser.isContainerChild;
    }
    //#region @backend
    return !!this.parent && this.parent.type === 'container';
    //#endregion
  }



  get isBundleMode() {
    if (Morphi.IsBrowser) {
      return true;
    }
    //#region @backend
    return Project.isBundleMode;
    //#endregion
  }

  get parent(): Project {
    if (Morphi.IsBrowser) {
      return this.browser.parent;
    }
    //#region @backend
    if (!_.isString(this.location)) {
      return void 0;
    }
    const parent = Project.From(path.join(this.location, '..'));
    if (parent && parent.isWorkspaceChildProject && this.isWorkspaceChildProject) { // QUICK_FIX for temporary projects
      return parent.parent;
    }
    return parent
    //#endregion
  }
  get preview(): Project {
    if (Morphi.IsBrowser) {
      return this.browser.preview;
    }
    //#region @backend
    return _.isString(this.location) && Project.From(path.join(this.location, 'preview'));
    //#endregion
  }


  /**
   * Check if project is based on baseline ( in package json workspace )
   * (method works from any level)
   */
  get isBasedOnOtherProject() {
    if (Morphi.IsBrowser) {
      return this.browser.isBasedOnOtherProject;
    }
    //#region @backend
    if (this.isWorkspace) {
      return !!this.packageJson.pathToBaseline;
    } else if (this.isWorkspaceChildProject) {
      return this.parent && !!this.parent.packageJson.pathToBaseline;
    }
    //#endregion
  }


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
    if (this.isContainer) {
      if (global.tnp_normal_mode) {
        error(`Baseline for container is not supported`, true, false)
      }
    } else if (this.isWorkspace) {
      return this.packageJson.pathToBaseline && Project.From(this.packageJson.pathToBaseline);
    } else if (this.isWorkspaceChildProject) {
      return this.parent && this.parent.baseline && Project.From(path.join(this.parent.baseline.location, this.name));
    }
    //#endregion
  }

  //#region @backend
  /**
   * Only for generated projects
   */
  get origin(): Project {
    if (!this.isGenerated) {
      // console.log('global.tnp_normal_mode',global.tnp_normal_mode)
      if (global.tnp_normal_mode) {
        warn(`Trying to access origin of not static project`, true);
      }
      return;
    }
    let project: Project;
    if (this.isWorkspace) {
      const originPath = path.resolve(path.join(this.location, '..', '..'));
      // console.log('originPath', originPath)
      project = Project.From(originPath);
    } else if (this.isWorkspaceChildProject) {
      const originChildPath = path.resolve(path.join(this.location, '..', '..', '..', this.name));
      // console.log('originChildPath', originChildPath)
      project = Project.From(originChildPath);
    }
    return project;
  }
  //#endregion

  //#region @backend
  /**
   * generated version of workspace/worskpace-childs project
   * ready for serving by tnp router/proxy
   */
  get distribution(): Project {
    const outDir: BuildDir = 'dist';
    let projectToBuild: Project;
    if (this.isGenerated) {
      if (!global.tnp_normal_mode) {
        return;
      }
      warn(`Trying to access distribution of distribution`, true);
      return;
    }
    if (this.isWorkspace) {
      projectToBuild = Project.From(path.join(this.location, outDir, this.name));
    } else if (this.isWorkspaceChildProject) {
      projectToBuild = Project.From(path.join(this.parent.location, outDir, this.parent.name, this.name));
    } else if (this.isStandaloneProject) {
      projectToBuild = Project.From(path.join(this.location, outDir));
    }
    return projectToBuild;
  }
  //#endregion

  //#region @backend
  /**
   * Same thing as distribution, but it will generate folder in
   * case that the does not exists
   */
  async StaticVersion(regenerate = true): Promise<Project> {

    let staticVersion: Project;
    if (this.isGenerated) {
      if (regenerate) {
        await this.origin.staticBuild.regenerate();
      }
      staticVersion = this as any;
    } else {

      if (regenerate || !this.distribution) {
        await this.staticBuild.regenerate();
      }
      staticVersion = this.distribution;
    }

    return staticVersion;
  }
  //#endregion

  get isBuildedLib() {
    if (Morphi.IsBrowser) {
      return this.browser.isBuildedLib;
    }
    //#region @backend
    if (this.type === 'angular-lib') {
      return fse.existsSync(path.join(this.location, config.folder.module)) &&
        fse.existsSync(path.join(this.location, config.folder.dist));
    }
    if (this.type === 'isomorphic-lib') {
      return fse.existsSync(path.join(this.location, config.folder.browser)) &&
        fse.existsSync(path.join(this.location, config.folder.dist));
    }
    //#endregion
  }

  get version() {
    if (Morphi.IsBrowser) {
      return this.browser.version;
    }
    //#region @backend
    return this.packageJson.version;
    //#endregion
  }

  get useFramework() {
    if (Morphi.IsBrowser) {
      return this.browser.useFramework;
    }
    //#region @backend
    if (!!this.baseline) {
      return this.baseline.packageJson.useFramework;
    }
    return this.packageJson.useFramework;
    //#endregion
  }

  //#region @backend
  get versionPatchedPlusOne() {

    if (!this.version) {

      if (!global[config.message.tnp_normal_mode]) {
        return;
      }

      error(`Please define ${chalk.bold('version')} property in your package.json`, true)
      error(path.join(this.location, config.file.package_json), false, true)
    }
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
    let basedOn = '';
    if (this.isWorkspace) {
      basedOn = this.packageJson.pathToBaseline;
    } else if (this.isWorkspaceChildProject) {
      basedOn = this.parent.packageJson.pathToBaseline;
    }

    // log('[tnp] basedOn' + basedOn)

    const res = (basedOn && basedOn !== '');
    // log(`[tnp] Project '${this.location}' is site: ${res}`)
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



  get isCommandLineToolOnly() {
    if (Morphi.IsBrowser) {
      return this.browser.isCommandLineToolOnly;
    }
    //#region @backend
    return this.packageJson.isCommandLineToolOnly;
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

  /**
   * Is generated for static build
   */
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

  get isWorkspaceChildProject() {
    if (Morphi.IsBrowser) {
      return this.browser.isWorkspaceChildProject;
    }
    //#region @backend
    if (!!this.parent && this.parent.isWorkspaceChildProject) { // QUICK_FIX for temporary projects
      return true;
    }
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
    return (!this.isWorkspaceChildProject && !this.isWorkspace && !this.isContainer && !this.isUnknowNpmProject);
    //#endregion
  }

  /**
   * Unknow npm project
   */
  get isUnknowNpmProject() {
    if (Morphi.IsBrowser) {
      return this.browser.isUnknowNpmProject;
    }
    //#region @backend
    return this.type === 'unknow-npm-project';
    //#endregion
  }


  get customizableFilesAndFolders() {
    if (Morphi.IsBrowser) {
      return this.browser.customizableFilesAndFolders;
    }
    //#region @backend

    const extraFolders = this.getFolders()
      .filter(f => !this.children.map(c => c.name).includes(path.basename(f)))
      .filter(f => !['src', 'backup'].includes(path.basename(f)))
      .map(f => path.basename(f))

    if (this.type === 'workspace') return [
      // 'environment.d.ts',
      'environment.js',
      'environment.dev.js',
      'environment.prod.js',
      'environment.test.js',
      'environment.stage.js',
      'environment.static.js',
      'environment.online.js'
    ].concat(!this.isSite ? extraFolders : [])
    const files: string[] = ['src']
    if (this.type === 'angular-lib') files.push('components');

    return files;
    //#endregion
  }

  //#region @backend
  private _path(relativePath: string, currentProjectLocation?: string) {
    if (_.isUndefined(currentProjectLocation)) {
      currentProjectLocation = this.location;
    }
    return {
      normal: path.join(currentProjectLocation, relativePath),
      custom: path.join(currentProjectLocation, config.folder.custom, relativePath),
      __prefixed: path.join(currentProjectLocation, path.dirname(relativePath), `__${path.basename(relativePath)}`),
    }
  }

  path(relativePath: string, currentProjectLocation?: string) {

    const self = this;
    return {
      get relative() {
        return self._path(relativePath, '');
      },
      get absolute() {
        return self._path(relativePath);
      }
    }
  }

  //#endregion

  //#region @backend
  containsFile(filePaht: string) {
    let fullPath = path.resolve(path.join(this.location, filePaht));
    let res = fse.existsSync(fullPath)
    // if (!res && process.platform === 'darwin') {
    //   fullPath = path.join('/private', fullPath);
    //   res = fse.existsSync(fullPath);
    // }
    // log(`res: ${res} : ${fullPath}`)
    return res;
  }
  //#endregion

  //#region @backend
  getFolders() {
    const notAllowed: RegExp[] = [
      '^\.vscode$', '^node\_modules$',
      ..._.values(config.tempFolders).map(v => `^${v}$`),
      '^e2e$', '^tmp.*', '^dist.*', '^tests$', '^module$', '^browser', 'bundle*',
      '^components$', '\.git', '^bin$', '^custom$'
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
    return subdirectories;
  }
  //#endregion


  //#region @backend
  getAllChildren(options?: { excludeUnknowProjects: boolean; }) {
    if (_.isUndefined(options)) {
      options = {} as any;
    }
    if (_.isUndefined(options.excludeUnknowProjects)) {
      options.excludeUnknowProjects = true;
    }
    const { excludeUnknowProjects } = options;
    const subdirectories = this.getFolders();

    let res = subdirectories
      .map(dir => {
        // log('child:', dir)
        return Project.From(dir);
      })
      .filter(c => !!c)

    if (excludeUnknowProjects) {
      res = res.filter(c => c.type !== 'unknow-npm-project')
    }
    return res;
  }
  //#endregion

  //#region @backend
  child(name: string, errors = true): Project {
    const c = this.children.find(c => c.name === name);
    if (errors && !c) {
      error(`Project doesnt contain child with name: ${name}`)
    }
    return c;
  }
  //#endregion

  //#region @backend
  /**
   * available frameworks in project
   */
  get frameworks() {
    return this.packageJson.frameworks;
  }
  //#endregion

  //#region @backend
  get workspaceDependencies(): Project[] {
    if (this.isWorkspaceChildProject) {
      if (this.isSite) {
        return this.baseline.workspaceDependencies.map(c => {
          return this.parent.child(c.name);
        });
      }
      return this.packageJson.workspaceDependencies.map(name => {
        const child = this.parent.child(name);
        if (!child) {
          error(`Unknow child "${name}" inside ${this.packageJson.path}`, true, true);
        }
        return child;
      }).filter(f => !!f);
    }
    return [];
  }
  //#endregion

  get children(): Project[] {
    if (Morphi.IsBrowser) {
      return this.browser.children;
    }
    //#region @backend
    return this.getAllChildren()
    //#endregion
  }

  get childrenThatAreLibs(): Project[] {
    if (Morphi.IsBrowser) {
      return this.browser.childrenThatAreLibs;
    }
    //#region @backend
    return this.children.filter(c => {
      return ([
        'angular-lib',
        'isomorphic-lib'
      ] as LibType[]).includes(c.type);
    });
    //#endregion
  }

  get childrenThatAreClients(): Project[] {
    if (Morphi.IsBrowser) {
      return this.browser.childrenThatAreClients;
    }
    //#region @backend
    return this.children.filter(c => {
      return ([
        'angular-lib',
        'isomorphic-lib',
        'angular-client',
        'ionic-client',
      ] as LibType[]).includes(c.type);
    });
    //#endregion
  }

  //#region  @backend
  get isomorphicPackages() {
    try {
      var p = path.join(this.location, FILE_NAME_ISOMORPHIC_PACKAGES)
      if (!fse.existsSync(p)) {
        PackagesRecognitionExtended.fromProject(this as any).start();
      }
      const f = fse.readJSONSync(p, {
        encoding: 'utf8'
      });
      const arr = f[configMorphi.array.isomorphicPackages];
      if (_.isArray(arr)) {
        return arr;
      } else {
        return [];
      }
      // warn(`Isomorphic package file does not exists : ${p}`);
    } catch (e) {
      log(e);
      error(`Erro while reading ismorphic package file: ${p}`, true, true);
      return [];
    };
  }
  //#endregion

  //#region @backend
  sourceFilesToIgnore() {
    return [];
  }
  //#endregion

  get childrenThatAreThirdPartyInNodeModules(): Project[] {
    if (Morphi.IsBrowser) {
      return this.browser.childrenThatAreThirdPartyInNodeModules;
    }
    //#region @backend
    return this.isomorphicPackages.map(c => {
      const p = path.join(this.location, config.folder.node_modules, c);
      return Project.From(p);
    }).filter(f => !!f);
    //#endregion
  }

  //#region @backend
  public recreateCodeWorkspace() {
    if (this.isWorkspace) {
      const configSettings = {};

      try {
        const settings = json5.parse(fse.readFileSync(path.join(this.location, '.vscode', 'settings.json'), {
          encoding: 'utf8'
        }).toString());
        // console.log(settings)
        Object.keys(settings)
          .filter(key => {
            const start = key.startsWith('workbench');
            // console.log(`${key} ${start}`)
            return start;
          })
          .forEach(key => {
            configSettings[key] = settings[key];
          });
      } catch (err) {
        // console.log(err)
      }

      const distributionFolder = path.join(this.location, config.folder.dist);
      if (!fse.existsSync(distributionFolder)) {
        fse.mkdirpSync(distributionFolder);
      }
      configSettings['terminal.integrated.cwd'] = '.';

      const codeWorkspace = {
        folders: [
          { path: '.' },
          ...this.children
            .map(c => {
              return { path: c.name }
            }),
          { path: 'dist' }
        ],
        settings: configSettings
      };
      fse.writeJSONSync(path.join(this.location,
        this.nameOfCodeWorkspace), codeWorkspace, {
          encoding: 'utf8',
          spaces: 2
        });
    }
  }

  get nameOfCodeWorkspace() {
    return `tmp.code-workspace`;
  }

  openInVscode() {
    this.recreateCodeWorkspace()
    if (this.isStandaloneProject || this.isUnknowNpmProject) {
      this.run(`code ${this.location}`).sync()
    } else {
      const isomorphicServers: Project[] = this.children.filter(c => c.type === 'isomorphic-lib');
      this.run(`code ${this.location}/${this.nameOfCodeWorkspace}`).sync();
      isomorphicServers.forEach(s => {
        s.run(`code ${s.location}`).sync()
      });
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
  protected async buildSteps(buildOptions?: BuildOptions) {
    // should be abstract
  }
  //#endregion

  //#region @backend
  linkTo(destPackageLocation: string) {
    HelpersLinks.createSymLink(this.location, destPackageLocation);
  }
  //#endregion

  //#region @backend
  public filesTemplates(): string[] {
    // should be abstract
    return []
  }
  //#endregion

  //#region @backend
  public projectSourceFiles(): string[] {
    // should be abstract
    return [
      ...this.filesTemplates(),
      ...(this.filesTemplates().map(f => f.replace(`.${config.filesExtensions.filetemplate}`, ''))),
      ...(this.projectSpecyficFiles())
    ];
  }
  //#endregion

  //#region @backend
  public projectSpecyficFiles(): string[] {
    // should be abstract
    return []
  }
  //#endregion

  //#region @backend
  public projectSpecyficIgnoredFiles() {
    return [];
  }
  //#endregion

  public routerTargetHttp() {
    if (Morphi.IsBrowser) {
      return this.browser._routerTargetHttp;
    }
    //#region @backend
    return `http://localhost:${this.getDefaultPort()}`;
    //#endregion
  }

  //#region @backend
  public setDefaultPort(port: number) {
    this.__defaultPort = port;
  }
  //#endregion


  public getDefaultPort() {
    if (Morphi.IsBrowser) {
      return this.browser && this.browser.defaultPort;
    }
    //#region @backend
    return this.__defaultPort;
    //#endregion
  }



  //#region @backend
  public setDefaultPortByType() {
    this.setDefaultPort(Project.DefaultPortByType(this.type))
  }
  //#endregion


  //#region @backend
  public run(command: string, options?: RunOptions) {
    if (!options) { options = {}; }
    if (!options.cwd) { options.cwd = this.location; }
    return __run(command, options);
  }
  //#endregion

  //#region @backend
  removeRecognizedIsomorphicLIbs() {
    try {
      const pjPath = path.join(this.location, config.file.package_json);
      const pj: IPackageJSON = fse.readJsonSync(pjPath, {
        encoding: 'utf8'
      });
      pj[configMorphi.array.isomorphicPackages] = void 0;
      fse.writeJsonSync(pjPath, pj, {
        encoding: 'utf8',
        spaces: 2
      });
    } catch (e) {

    }
  }
  //#endregion

  //#region @backend
  removeItself() {
    const location = this.location;
    Project.projects = Project.projects.filter(p => p.location !== location);
    tryRemoveDir(location);
  }
  //#endregion

  //#region @backend
  public reset(showMsg = true) {
    if (this.isWorkspace && this.isGenerated && this.isBasedOnOtherProject) {
      const siteLocationInDist = path.resolve(path.join('..', this.location, this.baseline.name));
      tryRemoveDir(siteLocationInDist);
    }
    if (showMsg) {
      log(`Reseting project: ${this.genericName}`);
    }
    this.removeRecognizedIsomorphicLIbs();
    let gitginoredfiles = this.recreate.filesIgnoredBy.gitignore
      .map(f => f.startsWith('/') ? f.substr(1) : f)
      .filter(f => {
        if (f === config.folder.node_modules) {
          return false;
        }
        if (config.filesNotAllowedToClen.includes(f)) {
          return false;
        }
        if (f.startsWith(config.folder.bundle) && this.isTnp) {
          return false;
        }
        return true;
      })
    if (this.isWorkspace) {
      gitginoredfiles = gitginoredfiles.filter(f => !f.startsWith(config.folder.dist))
    }

    for (let index = 0; index < gitginoredfiles.length; index++) {
      const fileOrDirPath = path.join(this.location, gitginoredfiles[index].trim());
      // log(`Removing: ${fileOrDirPath}`)
      rimraf.sync(fileOrDirPath)
    }
    this.quickFixes.missingSourceFolders()
  }
  //#endregion

  //#region @backend
  public clear() {
    log(`Cleaning project: ${this.genericName}`);
    this.node_modules.remove();
    this.reset(false)
  }
  //#endregion

  //#region @backend
  public allPackageJsonDeps(contextFolder?: string): Project[] {
    let projectsInNodeModules = [];
    ArrNpmDependencyType.forEach(depName => {
      projectsInNodeModules = projectsInNodeModules
        .concat(this.getDepsAsProject(depName, contextFolder));
    });
    return projectsInNodeModules;
  }
  //#endregion

  //#region @backend
  public getDepsAsProject(type: NpmDependencyType | TnpNpmDependencyType, contextFolder?: string): Project[] {
    return this.getDepsAsPackage(type).map(packageObj => {
      if (type === 'tnp_required_workspace_child') {
        let p = path.resolve(path.join(this.location, '..', packageObj.name))
        if (this.isWorkspaceChildProject && fse.existsSync(p)) {
          const project = Project.From(p);
          return project;
        }
      }

      let p = path.join(contextFolder ? contextFolder : this.location, config.folder.node_modules, packageObj.name);
      if (fse.existsSync(p)) {
        const project = Project.From(p);
        return project;
      }
      // warn(`Dependency '${packageObj.name}' doen't exist in ${p}`)
    })
      .filter(f => !!f)
  }
  //#endregion

  //#region @backend
  public getDepsAsPackage(type: NpmDependencyType | TnpNpmDependencyType): Package[] {
    if (!this.packageJson.data) {
      return [];
    }
    const isTnpOverridedDependency = (type === 'tnp_overrided_dependencies') &&
      this.packageJson.data.tnp &&
      this.packageJson.data.tnp.overrided &&
      this.packageJson.data.tnp.overrided.dependencies;

    const isTnpRequredWorkspaceChildren = (type === 'tnp_required_workspace_child') &&
      this.packageJson.data.tnp &&
      this.packageJson.data.tnp.required;

    let installType: InstalationType;

    let data: any;
    if (isTnpOverridedDependency) {
      data = this.packageJson.data.tnp.overrided.dependencies
    } else if (isTnpRequredWorkspaceChildren) {
      data = this.packageJson.data.tnp.required;
    } else {
      data = this.packageJson.data[type];
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

      })
  }
  //#endregion

  //#region @backend
  public checkIfReadyForNpm() {

    // log('TYPEEEEE', this.type)
    const libs: LibType[] = ['angular-lib', 'isomorphic-lib'];
    if (!libs.includes(this.type)) {
      error(`This project '${chalk.bold(this.name)}' isn't library type project (${libs.join(', ')}).`)
    }
    return true;
  }
  //#endregion


  //#region @backend
  private async selectAllProjectCopyto() {
    const db = await TnpDB.Instance;
    const projects = db
      .getProjects()
      .map(p => p.project)
      .filter(p => p.location !== this.location)

    this.buildOptions.copyto = projects;
  }

  private async selectProjectToCopyTO() {
    // clearConsole()
    const db = await TnpDB.Instance;
    if (!global.tnpNonInteractive) {
      const existedProject = db
        .getProjects()
        .map(p => p.project)
        .filter(p => p && !p.isWorkspaceChildProject)
        .filter(p => p.location !== this.location)

      if (global.tnpNonInteractive) {
        this.buildOptions.copyto = [];
      } else {
        const { projects = [] }: { projects: string[] } = await inquirer
          .prompt([
            {
              type: 'checkbox',
              name: 'projects',
              message: 'Select projects where to copy bundle after finish: ',
              choices: existedProject
                .map(c => {
                  return { value: c.location, name: c.genericName }
                })
            }
          ]) as any;

        this.buildOptions.copyto = projects.map(p => Project.From(p));
      }

    }

    if (!_.isArray(this.buildOptions.copyto)) {
      this.buildOptions.copyto = []
    }

    // log(this.buildOptions)
    // process.exit(0)

    await db.transaction.updateCommandBuildOptions(this.location, this.buildOptions);
  }
  //#endregion

  //#region @backend
  async build(buildOptions?: BuildOptions) {
    // log('BUILD OPTIONS', buildOptions)

    if (this.isCommandLineToolOnly) {
      buildOptions.onlyBackend = true;
    }


    this.buildOptions = buildOptions;

    let baseHref: string;
    // log('AM HERE')
    if (this.type === 'workspace') {
      baseHref = this.env.config.workspace.workspace.baseUrl;
    } else if (this.isWorkspaceChildProject) {
      const proj = this.env.config && this.env.config.workspace.projects.find(p => {
        return p.name === this.name
      });
      baseHref = proj ? proj.baseUrl : void 0
    }

    // log(`basehref for current project `, baseHref)
    this.buildOptions.baseHref = baseHref;

    if (this.buildOptions.copytoAll) {
      await this.selectAllProjectCopyto();
    } else {
      if (!Array.isArray(this.buildOptions.copyto) || this.buildOptions.copyto.length === 0) {
        if (this.isStandaloneProject) {
          await this.selectProjectToCopyTO()
        }
      }
    }

    if (_.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0) {

      const unique = {};
      (this.buildOptions.copyto as Project[]).forEach(p => unique[p.location] = p);
      this.buildOptions.copyto = Object.keys(unique).map(location => unique[location]);

      (this.buildOptions.copyto as Project[]).forEach(proj => {
        const project = proj;
        const projectCurrent = this;
        const projectName = projectCurrent.isTnp ? config.file.tnpBundle : projectCurrent.name;
        const what = path.normalize(`${project.location}/node_module/${projectName}`)
        info(`After each build finish ${what} will be update.`)
      });
    }

    if (this.buildOptions.copytoAll || (_.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0)) {
      this.packageJson.save('show before build')
    }
    PackagesRecognitionExtended.fromProject(this as any).start();
    // console.log('before build steps')
    await this.buildSteps(buildOptions);
    // console.log('after build steps')
    if (this.isStandaloneProject) {
      await this.copyManager.initCopyingOnBuildFinish(buildOptions);
    }
  }
  //#endregion

  //#region @backend
  /**
   * Start server on top of static build
   * @param port
   */
  public async start(args?: string) {

    if (this.isWorkspace && !this.isGenerated) {

      const genLocationWOrkspace = path.join(this.location, config.folder.dist, this.name);
      const genWorkspace = Project.From(genLocationWOrkspace)
      if (!genWorkspace) {
        error(`No  ${'dist'}ributon folder. Please run: ${chalk.bold('tnp static:build')} in this workspace.
Generated workspace should be here: ${genLocationWOrkspace}
        `)
      }

      genWorkspace.run(`tnp start ${args}`).async()
      return;
    }


    await this.env.init(args, true)
    this.filesTemplatesBuilder.rebuild()
    log(`Killing proces on port ${this.getDefaultPort()}`);
    await killProcessByPort(this.getDefaultPort())
    log(`Project: ${this.name} is running on port ${this.getDefaultPort()}`);
    const command = this.startOnCommand(args);
    if (_.isString(command)) {
      const p = this.run(this.startOnCommand(args)).async()
      // p.on('exit', (ee) => {
      //   console.trace('exit !!!!', ee)
      // })
    }
  }
  //#endregion

}








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
    if (!!mdc && mdc.exclude.length > 0) {
      exclude = mdc.exclude;
    }
    // if(exclude.length > 0) {
    //   log('exclude in Project', exclude)
    // }

    if (!(exclude.length > 0 && exclude.includes('children'))) {
      // log('SET CHILDREND')
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
    entity.browser.isWorkspace = entity.isWorkspace;
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

  //#region @backend
  private static typeFrom(location: string): LibType {
    const packageJson = PackageJSON.fromLocation(location);
    const type = packageJson.type;
    return type;
  }
  //#endregion

  //#region @backend
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
      // warn(`[project.from] Cannot find project in location: ${location}`)
      return;
    }
    if (!PackageJSON.fromLocation(location)) {
      // warn(`[project.from] Cannot find package.json in location: ${location}`)
      return;
    };
    const type = this.typeFrom(location);

    // console.log(`TYpe "${type}" for ${location} `)
    let resultProject: Project;
    if (type === 'isomorphic-lib') {
      const { ProjectIsomorphicLib } = require('../project-isomorphic-lib');
      resultProject = new ProjectIsomorphicLib(location);
    }
    if (type === 'angular-lib') {
      const { ProjectAngularLib } = require('../project-angular-lib')
      resultProject = new ProjectAngularLib(location);
    }
    if (type === 'angular-client') {
      const { ProjectAngularClient } = require('../project-angular-client');
      resultProject = new ProjectAngularClient(location);
    }
    if (type === 'workspace') {
      const { ProjectWorkspace } = require('../project-workspace');
      resultProject = new ProjectWorkspace(location);
    }
    if (type === 'docker') {
      const { ProjectDocker } = require('../project-docker');
      resultProject = new ProjectDocker(location);
    }
    if (type === 'ionic-client') {
      const { ProjectIonicClient } = require('../project-ionic-client');
      resultProject = new ProjectIonicClient(location);
    }
    if (type === 'container') {
      const { ProjectContainer } = require('../project-container');
      resultProject = new ProjectContainer(location);
    }
    if (type === 'unknow-npm-project') {
      const { ProjectUnknowNpm } = require('../project-unknow-npm');
      resultProject = new ProjectUnknowNpm(location);
    }

    // log(resultProject ? (`PROJECT ${resultProject.type} in ${location}`)
    //     : ('NO PROJECT FROM LOCATION ' + location))

    // log(`[project.from] Result project: ${resultProject.name}`)
    return resultProject;
  }
  //#endregion

  //#region @backend
  public static nearestTo(absoluteLocation: string, options?: { type?: LibType; findGitRoot?: boolean; }) {
    options = options || {};
    const { type, findGitRoot } = options;

    if (_.isString(type) && !LibTypeArr.includes(type)) {
      error(`[nearestTo] wrong type: ${type}`, false, true)
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
        if (project && project.type === type) {
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
      absoluteLocation = path.resolve(path.join(absoluteLocation, '..'))
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


  public static DefaultPortByType(type: LibType): number {
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
      error(`Current location is not a ${chalk.bold('tnp')} type project.

      location: "${process.cwd()}"

      }`, false, false);
    }
    // log('CURRENT', current.location)
    return current;
  }
  //#endregion

  //#region @backend
  static get Tnp() {

    let tnp = Project.From(config.pathes.tnp_folder_location);
    if (tnp) {
      const currentPathInSystem = path.join(tnp.location, config.file.tnp_system_path_txt);
      if (!fse.existsSync(currentPathInSystem)) {
        fse.writeFileSync(currentPathInSystem, tnp.location, 'utf8')
      }
    } else {
      let tnpBundleTnpPath;
      if (global.tnp_normal_mode) {
        tnpBundleTnpPath = fse.readFileSync(config.pathes.tnp_system_path_txt).toString().trim()
      } else {
        tnpBundleTnpPath = fse.readFileSync(config.pathes.tnp_system_path_txt_tnp_bundle).toString().trim()
      }
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

    if (libraryType === 'workspace') {
      const workspaceProject = Project.From(config.pathes.projectsExamples.workspace);
      return workspaceProject;
    }
    if (libraryType === 'container') {
      const containerProject = Project.From(config.pathes.projectsExamples.container);
      return containerProject;
    }

    const projectPath = path.join(config.pathes.projectsExamples.workspace, libraryType);
    if (!fse.existsSync(projectPath)) {
      error(`Bad library type: ${libraryType}`, true)
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

        // log('PROJECT FROM', location)


        this.packageJson = PackageJSON.fromProject(this);
        this.type = this.packageJson.type;
        this.quickFixes = new QuickFixes(this)
        this.quickFixes.missingSourceFolders()
        this.staticBuild = new StaticBuild(this)
        this.workspaceSymlinks = new WorkspaceSymlinks(this);
        this.tnpBundle = new TnpBundle(this);
        this.node_modules = new NodeModules(this);
        this.npmPackages = new NpmPackages(this)
        this.recreate = new FilesRecreator(this);
        this.filesFactory = new FilesFactory(this);
        this.sourceModifier = new SourceModifier(this);
        this.frameworkFileGenerator = new FrameworkFilesGenerator(this);
        this.filesTemplatesBuilder = new FilesTemplatesBuilder(this);
        if (!this.isStandaloneProject) {
          this.join = new BaselineSiteJoin(this);
        }
        this.tests = new TestRunner(this);

        Project.projects.push(this);

        // this.requiredLibs = this.packageJson.requiredProjects;


        this.__defaultPort = Project.DefaultPortByType(this.type);
        // log(`Default port by type ${this.name}, baseline ${this.baseline && this.baseline.name}`)
        if (!this.isStandaloneProject) {
          this.env = new EnvironmentConfig(this);
          this.proxyRouter = new ProxyRouter(this);
        }
        this.copyManager = new CopyManager(this);
        if (this.isStandaloneProject) {
          this.packageJson.updateHooks()
        }
        this.filesStructure = new FilesStructure(this);
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
      resetFiles(...relativePathes: string[]) {
        relativePathes.forEach(p => {
          try {
            self.run(`git checkout HEAD -- ${p}`, { cwd: self.location }).sync()
          } catch (err) {
            error(`[project.git] Not able to reset files: ${p} inside project ${self.name}.`
              , true, true)
          }
        })
      },
      get isGitRepo() {
        try {
          var test = self.run('git rev-parse --is-inside-work-tree',
            {
              cwd: self.location,
              output: false
            }).sync();
        } catch (e) {
        }
        return !!test;
      },
      get isGitRoot() {
        return fse.existsSync(path.join(self.location, '.git'))
      },
      async updateOrigin(askToRetry = false) {
        await pullCurrentBranch(self.location, askToRetry);
      },
      pushCurrentBranch() {
        self.run(`git push origin ${currentBranchName(self.location)}`).sync()
      },
      pullCurrentBranch() {
        self.run(`git pull origin ${currentBranchName(self.location)}`).sync()
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



