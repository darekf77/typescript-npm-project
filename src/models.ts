import { Project } from "./project/base-project";


export type FileEvent = 'created' | 'changed' | 'removed' | 'rename';

export type InstalationType = '-g' | '--save' | '--save-dev';

export type Dependencies = 'dependencies' | 'devDependencies' | 'peerDependencies';

export type Package = { name: string; version: string; };

export type LibType = "angular-lib" | "isomorphic-lib" | 'angular-client' | "ionic-client" | 'server-lib' | 'workspace' | 'angular-cli' | 'docker';

export type RecreateFile = { where: string; from: string };

export type BuildDir = 'dist' | 'bundle';

export type RuleDependency = { dependencyLib: Project; beforeProject: Project };

export interface TnpRouter {
  url?: {
    prefix?: string;
    base?: string;
  };
  routes: EnvConfigProject[];
}

export type EnvironmentName = 'local' | 'dev' | 'stage' | 'prod'

export interface ReleaseOptions {
  prod?: boolean;
  bumbVersionIn?: string[];
}

export class BuildOptions {
  prod: boolean;
  outDir: BuildDir;
  watch?: boolean;
  appBuild?: boolean;
  baseHref?: string;
  onlyWatchNoBuild?: boolean;
  proxyRouterMode?: boolean;
  copyto?: Project[];
  environmentName: EnvironmentName;
  additionalIsomorphicLibs?: string[];

  public static stringify(prod = false, watch = false, outDir: BuildDir = 'dist', additionalIsomorphicLibs = []) {
    const o = {
      env: [
        '--env.prod=' + prod,
        '--env.watch=' + watch,
        '--env.outDir=' + outDir,
        '--env.additionalIsomorphicLibs=' + encodeURIComponent(additionalIsomorphicLibs.toString())
      ]
    }
    return `${o.env.join(' ')}`;
  }

}

export interface RunOptions {

  /**
   * Show process output
   */
  output?: boolean;
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


import { ConnectionOptions } from "typeorm";

export interface EnvConfigProject {
  baseUrl: string;
  host?: string; // tnp generated
  hostSocket?: string; // tnp generated
  externalHost?: string;
  name: string;  // tnp checked
  port: number; // override tnp type port
  type?: LibType; // tnp checked
  $db?: ConnectionOptions;
  isWatchBuild?: boolean; // tnp generated
}

export interface EnvConfig {

  pathes?: any;
  isCoreProject?: boolean; // tnp generated
  isSiteProject?: boolean; // tnp generated
  name?: EnvironmentName; // tnp generated
  proxyRouterMode?: boolean; // tnp generated
  domain?: string;
  ip?: string;
  workspace: {
    workspace: EnvConfigProject;
    build?: {
      browser: {
        minify: boolean;
        aot: boolean;
        production: boolean;
      },
      server: {
        minify: boolean;
        production: boolean;
      }
    },
    projects: EnvConfigProject[]
  }
  packageJSON?: IPackageJSON;

}


export interface IPackageJSON {
  name: string;
  version: string;
  bin?:any;
  main?: string;
  preferGlobal?: boolean;

  dependencies?: { [name: string]: string; };
  devDependencies?: { [name: string]: string; };
  tnp: {
    type: LibType;
    isCoreProject: boolean;
    basedOn: Project | string,
    resources?: string[];
    // requiredLibs?: string[];
  };
}
