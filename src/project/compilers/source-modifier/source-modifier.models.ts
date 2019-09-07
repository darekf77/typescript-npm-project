import { Project } from '../../index';

export type SourceCodeType =
  'angular-lib(app) src/' |
  'angular-lib(lib) components/' |
  'angular-lib(app) custom/src/' |
  'angular-lib(lib) custom/components/' |
  'isomorphic-lib(lib) src/' |
  'isomorphic-lib(lib) custom/src/' |
  'angular-client(app) src/' |
  'angular-client(app) custom/src/' |
  'ionic-client(app) src/' |
  'ionic-client(app) custom/src/' |
  'electron-client(app) src/' |
  'electron-client(app) custom/src/'
  ;

export type ModType = 'app' | 'lib' | 'custom/app' | 'custom/lib' | 'tmp-src';

export type CheckType = 'standalone' | 'baseline' | 'site';

export type ImpReplaceOptions = {
  debugMatch?: boolean;
  debugNotMatch?: boolean;
  relativePath: string,
  project: Project,
  method: CheckType,
  modType: ModType,
  partsReplacementsOptions?: { replaceWhole?: boolean };
  urlParts: (string | string[])[],
  notAllowedAfterSlash?: (string | string[])[],
  partsReplacements: (string | string[])[],
  name: string;
  input: string,
}
