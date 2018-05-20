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
  routes: TnpRoute[];
}
export type TnpRoute = { url: string; localEnvPort: number, project: string; }

export type EnvironmentName = 'local' | 'dev' | 'stage' | 'prod'

export class BuildOptions {
  prod: boolean;
  outDir: BuildDir;
  watch?: boolean;
  appBuild?: boolean;
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
  externalHost?: string;
  name: string;  // tnp checked
  port: number; // override tnp type port
  type?: LibType; // tnp checked
  $db?: ConnectionOptions;
  isWatchBuild?: boolean; // tnp generated
}

export interface EnvConfig {
  isCoreProject?: boolean; // tnp generated
  isSiteProject?: boolean; // tnp generated
  name?: EnvironmentName; // tnp generated
  domain?: string;
  workspace: {
    build?: {
      browser: {
        minify: boolean;
        aot: boolean;
      },
      server: {
        minify: boolean;
      }
    },
    projects: EnvConfigProject[]
  }
  packageJSON?: IPackageJSON;

  currentProject?: EnvConfigProject;

}


export interface IPackageJSON {
  name: string;
  version: string;
  tnp: {
    type: LibType;
    isCoreProject: boolean;
    basedOn: Project | string,
    resources?: string[];
    requiredLibs?: string[];
  };
}
