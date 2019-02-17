
export * from './build-options';
export * from './build-dir';
export * from './lib-type';
export * from './environment-name';
export * from './env-config';
export * from './ipackage-json';
export * from './ps-info';

export type FileEvent = 'created' | 'changed' | 'removed' | 'rename';

export type InstalationType = '-g' | '--save' | '--save-dev';

export type Dependencies = 'dependencies' | 'devDependencies' | 'peerDependencies';

export type Package = { name: string; version: string; };

export type RecreateFile = { where: string; from: string };

export interface ReleaseOptions {
  prod?: boolean;
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
