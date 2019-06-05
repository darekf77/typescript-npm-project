import { LibType } from './lib-type';
import { ConnectionOptions } from 'typeorm';
import { EnvironmentName } from './environment-name';
import { IPackageJSON } from './ipackage-json';

export interface EnvConfigProject {
  baseUrl: string;
  host?: string; // tnp generated
  externalHost?: string;
  name: string;  // tnp checked
  type?: LibType; // tnp checked

  port: number; // override tnp type port
  //#region @backend
  $db?: ConnectionOptions;
  ommitAppBuild?: boolean;
  isWatchBuild?: boolean; // tnp generated
  //#endregion
}

export type UIFramework = 'bootstrap' | 'material' | 'ionic';

export interface EnvConfig {

  pathes?: any;
  isCoreProject?: boolean; // tnp generated
  isSiteProject?: boolean; // tnp generated
  name?: EnvironmentName; // tnp generated
  frameworks?: UIFramework[];
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
  currentProjectType?: LibType;
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

