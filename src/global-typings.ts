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
      tnpShowProgress?: boolean;
      tnpNoColorsMode?: boolean;
      spinner: Ora;
      //#endregion

    }
  }
}
