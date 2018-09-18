//#region @backend
import { EntityRepository, META } from 'morphi';
import { DIALOG } from '../entities/DIALOG';

export interface DIALOG_ALIASES {

  dialog: string;
  dialogs: string;

}

@EntityRepository(DIALOG)
export class DIALOG_REPOSITORY extends META.BASE_REPOSITORY<DIALOG, DIALOG_ALIASES> {


  globalAliases: (keyof DIALOG_ALIASES)[] = ['dialog', 'dialogs'];


}

//#endregion
