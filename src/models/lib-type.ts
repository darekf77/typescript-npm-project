export type LibType = 'angular-lib'
  | 'isomorphic-lib'
  | 'angular-client'
  | 'ionic-client'
  | 'workspace'
  | 'container'
  | 'docker'
  | 'unknow-npm-project';

export const LibTypeArr: LibType[] = [
  'angular-lib',
  'isomorphic-lib',
  'angular-client',
  'ionic-client',
  'workspace',
  'container',
  'docker',
  'unknow-npm-project',
]

export type CoreLibCategory = LibType | 'common';

export const CoreLibCategoryArr: CoreLibCategory[] = [
  'angular-client',
  'angular-lib',
  'ionic-client',
  'isomorphic-lib',
  'docker',
  'common'
]

export type NewFactoryType = LibType | 'model';
