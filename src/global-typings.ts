//#region @backend
import { Ora } from 'ora';
//#endregion
import { Models } from './models';



declare global {
  namespace NodeJS {
    interface Global {
      tnp_normal_mode: boolean;
      tnp_out_folder: Models.dev.BuildDir;
      muteMessages: boolean;
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
