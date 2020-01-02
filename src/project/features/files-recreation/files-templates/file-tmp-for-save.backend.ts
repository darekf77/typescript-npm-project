import * as _ from 'lodash';
import * as path from 'path';
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
