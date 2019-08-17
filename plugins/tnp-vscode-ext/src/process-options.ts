export type LibType = "angular-lib"
  | "isomorphic-lib"
  | 'angular-client'
  | "ionic-client"
  | 'workspace'
  | 'container'
  | 'docker'
  | 'unknow-npm-project';

export type ProcesOptions = {
  findNearestProject?: boolean;
  findNearestProjectWithGitRoot?: boolean;
  findNearestProjectType?: LibType;
  findNearestProjectTypeWithGitRoot?: LibType;
  syncProcess?: boolean;
  reloadAfterSuccesFinish?: boolean;
  cancellable?: boolean;
  title?: string;
  tnpNonInteractive?: boolean;
  debug?: boolean;
};
