//#region @backend
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import chalk from 'chalk';
import {
  StaticBuild, TestRunner,
  FilesStructure, FilesTemplatesBuilder, BuildProcess,
  WorkspaceSymlinks, NodeModules, FilesRecreator, FilesFactory,
  QuickFixes, NpmPackages, ProxyRouter, TargetProject, GitActions,
  SmartNodeModules, RecentFilesForContainer, LinkedRepos, Branding, DocsAppBuildConfig, AssetsManager
} from '../../features';

import { BaselineSiteJoin, SourceModifier, FrameworkFilesGenerator, AssetsFileListGenerator } from '../../compilers';
import { CompilerCache } from '../../features/compiler-cache.backend';
import { CopyManager } from '../../features/copy-manager';
import { IncrementalBuildProcess } from '../../compilers/build-isomorphic-lib/compilations/incremental-build-process.backend';
import { PackageJSON, EnvironmentConfig } from '../../features';
import { InsideStructures } from '../../features/inside-structures/inside-structures';
import { SingularBuild } from '../../features/singular-build.backend';
import { WebpackBackendCompilation } from '../../features/webpack-backend-compilation.backend';
//#endregion
import { _ } from 'tnp-core';


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
  public docsAppBuild: DocsAppBuildConfig;
  //#endregion

  //#region @backend
  public buildProcess: BuildProcess;
  //#endregion

  //#region @backend
  public assetsManager: AssetsManager;
  //#endregion

  //#region @backend
  public workspaceSymlinks: WorkspaceSymlinks;
  //#endregion

  //#region @backend
  public targetProjects: TargetProject;
  //#endregion

  //#region @backend
  public recent: RecentFilesForContainer;
  //#endregion

  //#region @backend
  public gitActions: GitActions;
  //#endregion

  //#region @backend
  public branding: Branding;
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
  public smartNodeModules: SmartNodeModules;
  //#endregion

  //#region @backend
  public frameworkFileGenerator: FrameworkFilesGenerator;
  //#endregion

  //#region @backend
  public assetsFileListGenerator: AssetsFileListGenerator;
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
  public insideStructure: InsideStructures;
  //#endregion

  //#region @backend
  public singluarBuild: SingularBuild;
  //#endregion

  //#region @backend
  public webpackBackendBuild: WebpackBackendCompilation;
  //#endregion

  //#region @backend
  public linkedRepos: LinkedRepos;
  //#endregion

}
