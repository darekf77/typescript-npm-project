//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import {
  StaticBuild, TestRunner,
  FilesStructure, FilesTemplatesBuilder, BuildProcess,
  WorkspaceSymlinks, NodeModules, FilesRecreator, FilesFactory,
  QuickFixes, NpmPackages, ProxyRouter, TargetProject, GitActions,
} from '../../features';

import { BaselineSiteJoin, SourceModifier, FrameworkFilesGenerator } from '../../compilers';
import { CompilerCache } from '../../features/compiler-cache.backend';
import { CopyManager } from '../../features/copy-manager';
import { IncrementalBuildProcessExtended } from '../../compilers';
import { PackageJSON, EnvironmentConfig } from '../../features';
//#endregion
import * as _ from 'lodash';



export abstract class FeatureProject {

  //#region @backend
  public tests: TestRunner;
  //#endregion

  //#region @backend
  public packageJson: PackageJSON;
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
  public targetProjects: TargetProject;
  //#endregion

  //#region @backend
  public gitActions: GitActions;
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

  //#region @backend
  public env: EnvironmentConfig;
  //#endregion

  //#region @backend
  public proxyRouter: ProxyRouter;
  //#endregion

  //#region @backend
  public copyManager: CopyManager;
  //#endregion

  //#region @backend
  public compilerCache: CompilerCache;
  //#endregion

  //#region @backend
  incrementalBuildProcess: IncrementalBuildProcessExtended;
  //#endregion

}
