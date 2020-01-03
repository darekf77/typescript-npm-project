//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import {
  StaticBuild, TestRunner, TnpBundle,
  FilesStructure, FilesTemplatesBuilder, BuildProcess,
  WorkspaceSymlinks, NodeModules, FilesRecreator, FilesFactory,
  QuickFixes, NpmPackages, ProxyRouter
} from '../../features';
import { BaselineSiteJoin, SourceModifier, FrameworkFilesGenerator, OutputCodeModifier } from '../../compilers';
import { CopyManager } from '../../features/copy-manager';
//#endregion
import * as _ from 'lodash';

import { Project } from './project';
import { Helpers } from 'tnp-helpers';
import { Morphi } from 'morphi';
import { Models } from 'tnp-models';
import { config } from '../../../config';
import { PackageJSON, EnvironmentConfig } from '../../features';

export abstract class FeatureProject {

  //#region @backend
  public tests: TestRunner;
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
  public outputCodeModifier: OutputCodeModifier;
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

  public env: EnvironmentConfig;

  //#region @backend
  public proxyRouter: ProxyRouter;
  //#endregion

  //#region @backend
  public copyManager: CopyManager;
  //#endregion

}
