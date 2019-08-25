
import { Project } from '../project/abstract/project';
import { Package } from './ipackage-json';
import { LibType } from './lib-type';

export * from './build-options.interface';
export * from './build-dir';
export * from './lib-type';
export * from './environment-name';
export * from './env-config';
export * from './ipackage-json';
export * from './ps-info';
export * from './replace-options-extended';
export * from './project.interface';
export * from './start-for-options';

export type RootArgsType = {
  tnpNonInteractive: boolean;
  tnpShowProgress: boolean;
  tnpNoColorsMode: boolean;
  findNearestProject: boolean;
  findNearestProjectWithGitRoot: boolean;
  findNearestProjectType: LibType;
  findNearestProjectTypeWithGitRoot: LibType;
  cwd: string;
};


export interface ActualNpmInstallOptions {
  generatLockFiles?: boolean;
  useYarn?: boolean;
  pkg?: Package;
  reason: string;
  smoothInstall?: boolean;
  remove?: boolean;
}


export interface NpmInstallOptions {
  remove?: boolean;
  npmPackage?: Package[],
  smoothInstall?: boolean;
}

export interface GenerateProjectCopyOpt {
  override?: boolean;
  markAsGenerated?: boolean;
  regenerateOnlyCoreProjects?: boolean;
  filterForBundle?: boolean;
  showInfo?: boolean;
  ommitSourceCode?: boolean;
  regenerateProjectChilds?: boolean;
  useTempLocation?: boolean;
}

export type SaveAction = 'save' | 'show' | 'hide';

export type PackageJsonSaveOptions = {
  action: SaveAction;
  newDeps: any;
  toOverride: any;
  reasonToShowPackages: string;
  reasonToHidePackages: string;
}

export type ProjectBuild = { project: Project; appBuild: boolean; }

export type SourceFolder = 'src' | 'components' | 'custom' | 'tmp-src';

export type FileEvent = 'created' | 'changed' | 'removed' | 'rename';

export type CutableFileExt = 'scss' | 'css' | 'sass' | 'html' | 'ts';

export type FileExtension = 'ts' | 'js' | 'json' | 'html' | 'jpg' | 'png' | 'txt' | CutableFileExt;


export type RecreateFile = { where: string; from: string };

export interface ReleaseOptions {
  prod?: boolean;
  args?: string;
  bumbVersionIn?: string[];
}

export interface RunOptions {

  /**
   * Show process output
   */
  output?: boolean;

  silence?: boolean;

  /**
   * Modify output line by line
   */
  outputLineReplace?: (outputLine: string) => string;


  // detached?: boolean;
  cwd?: string;

  /**
   * Try command again after fail after n miliseconds
   */
  tryAgainWhenFailAfter?: number;

  /**
   * Use big buffer for big webpack logs
   */
  biggerBuffer?: boolean;
}

export interface WatchOptions {
  cwd: string;
  wait?: number;
}


export interface ProjectForAutoBuild {
  cwd: string,
  command: string;
  commandWatch: string;
  args?: string[];
}

export interface ProjectForAutoRelease {
  cwd: string,
  command: string;
  args?: string[];
}

export interface AutoActionsUser {
  builds?: ProjectForAutoBuild[];
  autoreleases?: ProjectForAutoRelease[];
}
