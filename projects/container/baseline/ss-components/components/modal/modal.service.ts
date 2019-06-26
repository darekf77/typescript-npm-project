//#region @cutCodeIfFalse ENV.frameworks.includes('material')
import { MatDialog } from '@angular/material/dialog';
//#endregion

import { TemplateRef, Injectable } from '@angular/core';

import { EnvConfig } from 'tnp-bundle';

declare const ENV: EnvConfig;

@Injectable()
export class ModalService {

  constructor(
    //#region @cutCodeIfFalse ENV.frameworks.includes('material')
    public dialogMaterial: MatDialog,
    //#endregion
  ) {

  }


  open<T = any>(template: TemplateRef<T>) {

    //#region @cutCodeIfFalse ENV.frameworks.includes('material')
    if (ENV.frameworks.includes('material')) {
      this.dialogMaterial.open(template);
    }
    //#endregion
    if (ENV.frameworks.includes('bootstrap')) {
      console.log('Bootstrap modal !!!')
    }
  }

  close() {

  }

}
