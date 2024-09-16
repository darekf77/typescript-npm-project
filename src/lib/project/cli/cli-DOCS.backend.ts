//#region @backend
import { _ } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { CommandLineFeature } from 'tnp-helpers/src';
import { Project } from '../abstract/project';
import { DocsProvider } from '../features/docs-provider';
class $Docs extends CommandLineFeature<{}, Project> {
  public async _() {
    await new DocsProvider(this.project).start();
    this._exit(0);
  }

  async watch() {
    await new DocsProvider(this.project).startAndWatch();
  }
}

export default {
  $Docs: Helpers.CLIWRAP($Docs, '$Docs'),
};
//#endregion
