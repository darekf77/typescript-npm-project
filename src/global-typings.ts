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
      tnpShowProgress?: boolean;
      tnpNonInteractive?: boolean;
      //#region @backend
      tnpNoColorsMode?: boolean;
      spinner: Ora;
      //#endregion

    }
  }
}
