//#region @backend
import { _ } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { CommandLineFeature } from 'tnp-helpers/src';
import { Project } from '../abstract/project';

import { watch } from 'fs';
class $Docs extends CommandLineFeature<{}, Project> {
  public async _() {
    await this.project.docs.runTask({
      initalParams: {
        docsOutFolder: this.firstArg,
      },
    });
    this._exit(0);
  }

  async watch() {
    await this.project.docs.runTask({
      watch: true,
    });
  }
}

export default {
  $Docs: Helpers.CLIWRAP($Docs, '$Docs'),
};
//#endregion
