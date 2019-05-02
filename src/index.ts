//#region @backend
import { Ora } from 'ora';
//#endregion
import { BuildDir } from './models';

declare global {
  namespace NodeJS {
    interface Global {
      tnp_normal_mode: boolean;
      tnp_out_folder: BuildDir;
      testMode: boolean;
      hideWarnings: boolean;
      hideInfos: boolean;
      hideLog: boolean;
      //#region @backend
      spinner: Ora;
      //#endregion

    }
  }
}


export * from './config';
export * from './helpers/helpers';
export * from './helpers/helpers-environment';
export * from './models';
export * from './project';
//#region @backend
export * from './helpers/helpers-links';
export * from './tnp-db';
export * from './helpers/helpers-git';
export * from './helpers/helpers-process';
export * from './project/features/build-isomorphic-lib';
//#endregion
export * from './progress-output';
