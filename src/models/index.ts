import { BuildDir } from './build-dir';
import { BuildOptions } from '../project/features/build-options';
import { Project } from '../project/abstract/project';

export * from './build-options.interface';
export * from './build-dir';
export * from './lib-type';
export * from './environment-name';
export * from './env-config';
export * from './ipackage-json';
export * from './ps-info';
export * from './replace-options-extended';
export * from './project.interface';

export type ProjectBuild = { project: Project; appBuild: boolean; }

export interface StartForOptions {
  prod?: boolean;
  watch?: boolean;
  outDir?: BuildDir;
  args: string;
  staticBuildAllowed?: boolean;
  overrideOptions?: BuildOptions;
};
export type SourceFolder = 'src' | 'components' | 'custom' | 'tmp-src';

export type FileEvent = 'created' | 'changed' | 'removed' | 'rename';

export type CutableFileExt = 'scss' | 'css' | 'sass' | 'html' | 'ts';


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
