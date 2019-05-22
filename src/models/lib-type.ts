export type LibType = "angular-lib"
  | "isomorphic-lib"
  | 'angular-client'
  | "ionic-client"
  | 'workspace'
  | 'container'
  | 'docker'
  | 'unknow-npm-project'


export type NewFactoryType = LibType | 'model';
