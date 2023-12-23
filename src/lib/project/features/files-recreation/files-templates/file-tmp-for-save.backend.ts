import { _ } from 'tnp-core/src';
import { path } from 'tnp-core/src'
import { Helpers } from 'tnp-helpers/src';

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
