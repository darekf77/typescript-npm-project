import * as _ from 'lodash';
import { FileTmpForSave } from './file-tmp-for-save.backend';

export abstract class BaseFiredevFileTemplate {
  protected readonly FramweorkName: 'Morphi' | 'Firedev' = 'Morphi';

  get ControllerName() {
    return `${_.upperFirst(_.camelCase(this.ModuleName))}Controller`;
  }

  get ENTITYName() {
    return this.ModuleName.toUpperCase();
  }

  protected baseImports() {
    return `
import * as _ from 'lodash';
//#region @backend
import * as path from 'path';
import * as fse from 'fs-extra';
//#endregion
    `.trim();
  }

  constructor(
    public location: string,
    public ModuleName: string
  ) { }

  abstract files(): FileTmpForSave[];

  save() {
    if (_.isFunction(this.files)) {
      const files = this.files();
      if (_.isArray(files)) {
        for (let index = 0; index < files.length; index++) {
          const file = files[index];
          file.save()
        }
      }
    }
  }

}
