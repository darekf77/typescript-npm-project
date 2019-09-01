//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import {
  StaticBuild, TestRunner, PackageJSON, TnpBundle,
  FilesStructure, FilesTemplatesBuilder, BuildProcess,
  WorkspaceSymlinks, NodeModules, FilesRecreator, FilesFactory,
  QuickFixes, NpmPackages, EnvironmentConfig, ProxyRouter
} from '../../features';
//#endregion
import * as _ from 'lodash';

import { Project } from './project';
import { Helpers } from '../../../helpers';
import { Morphi } from 'morphi';
import { Models } from '../../../models';
import { config } from '../../../config';
import { BaselineSiteJoin, SourceModifier, FrameworkFilesGenerator } from '../../compilers';
import { CopyManager } from '../../features/copy-manager';

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


// export interface FeatureProject extends Partial<Project> { }
