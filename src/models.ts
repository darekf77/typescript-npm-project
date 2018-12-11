import * as _ from 'lodash';


import { Project } from "./project/base-project";

export type FileEvent = 'created' | 'changed' | 'removed' | 'rename';

export type InstalationType = '-g' | '--save' | '--save-dev';

export type Dependencies = 'dependencies' | 'devDependencies' | 'peerDependencies';

export type Package = { name: string; version: string; };

export type LibType = "angular-lib"
  | "isomorphic-lib"
  | 'angular-client'
  | "ionic-client"
  | 'server-lib'
  | 'workspace'
  | 'angular-cli'
  | 'docker'
  | 'unknow-npm-project'

export type RecreateFile = { where: string; from: string };

export type BuildDir = 'dist' | 'bundle';




export type EnvironmentName = 'local' | 'dev' | 'stage' | 'prod' | 'online' | 'test';

export interface ReleaseOptions {
  prod?: boolean;
  bumbVersionIn?: string[];
}



export interface IBuildOptions {
  prod: boolean;
  outDir: BuildDir;
  watch?: boolean;
  args?: string;
  compileOnce?: boolean;
  appBuild?: boolean;
  baseHref?: string;
  onlyWatchNoBuild?: boolean;
  copyto?: Project[];
  additionalIsomorphicLibs?: string[];
}

export class BuildOptions implements IBuildOptions {

  public static PropsToOmmitWhenStringify = ['copyto', 'forClient'];
  prod: boolean;
  outDir: BuildDir;
  watch?: boolean;
  args?: string;

  /**
   * Do not generate backend code
   */
  genOnlyClientCode?: boolean;
  appBuild?: boolean;
  baseHref?: string;

  /**
   * In watch mode compile once and exit
   */
  compileOnce?: boolean;
  onlyWatchNoBuild?: boolean;
  copyto?: Project[];

  /**
   * For isomorphic-lib
   * Specyify build targets as workspace childs projects names
   */
  forClient?: Project[];

  additionalIsomorphicLibs?: string[];

  public toString = () => {
    return JSON.stringify(_.mergeWith({}, _.omit(this, BuildOptions.PropsToOmmitWhenStringify)), null, 4);
  };

  public static fromRaw(options: IBuildOptions): BuildOptions {
    return _.merge(new BuildOptions(), options);
  }

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

  silence?: boolean;


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


import { ConnectionOptions } from "typeorm";

export interface EnvConfigProject {
  baseUrl: string;
  host?: string; // tnp generated
  hostSocket?: string; // tnp generated
  externalHost?: string;
  name: string;  // tnp checked
  type?: LibType; // tnp checked

  //#region @backend
  port: number; // override tnp type port
  $db?: ConnectionOptions;
  ommitAppBuild?: boolean;
  isWatchBuild?: boolean; // tnp generated
  //#endregion
}

export interface EnvConfig {

  pathes?: any;
  isCoreProject?: boolean; // tnp generated
  isSiteProject?: boolean; // tnp generated
  name?: EnvironmentName; // tnp generated
  domain?: string;
  dynamicGenIps?: boolean;
  ip?: string | 'localhost';
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
  currentProjectName?: string;
  packageJSON?: IPackageJSON;

  cloud?: {
    ports: {
      update: number;
    }
  }

  build?: {
    number?: number;
    hash?: string;
    date?: Date;
  }

}

export type DependenciesFromPackageJsonStyle = { [name: string]: string; }

export interface IPackageJSON {
  name: string;
  version: string;
  bin?: any;
  main?: string;
  preferGlobal?: boolean;
  engines?: { node: string; npm: string; }
  license?: string;

  dependencies?: DependenciesFromPackageJsonStyle;
  devDependencies?: DependenciesFromPackageJsonStyle;
  tnp: {
    type: LibType;
    isCoreProject: boolean;
    core: {
      dependencies: {
        always?: string[];
        asDevDependencies?: string[];
        dedupe: string[];
        common: DependenciesFromPackageJsonStyle | { [groupAlias: string]: DependenciesFromPackageJsonStyle };

        // libtype of workspace project
        onlyFor: { [libType: string]: DependenciesFromPackageJsonStyle | { [groupAlias: string]: DependenciesFromPackageJsonStyle }; }
      }
    }
    basedOn: string,
    basedOnAbsolutePath1: string, // TODO QUICK_FIX
    basedOnAbsolutePath2: string, // TODO QUICK_FIX
    resources?: string[];
    allowedEnv?: EnvironmentName[];
    isGenerated?: boolean;
    overrided: {
      dedupe?: string[];
      ignoreWhenStartWith?: string[];
      includeOnly?: string[];
      includeAsDev?: string[];
      dependencies?: DependenciesFromPackageJsonStyle;
    }
    // requiredLibs?: string[];
  };
}
