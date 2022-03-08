import { _ } from 'tnp-core';
import { path } from 'tnp-core'
import { Helpers } from 'tnp-helpers';

export class FileTmpForSave {
  public template: string;
  constructor(
    template: string,
    public location: string,
    public fileName: string,
  ) {
    this.template = _.isString(template) ? template.trim() : '';
  }

  save() {
    Helpers.writeFile(path.join(this.location, this.fileName), this.template);
  }

}
