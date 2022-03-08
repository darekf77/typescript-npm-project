import { _ } from 'tnp-core';
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
import { _ } from 'tnp-core';
//#region @backend
import { path } from 'tnp-core'
import { fse } from 'tnp-core'
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
