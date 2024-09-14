//#region @backend
import { _ } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { CommandLineFeature } from 'tnp-helpers/src';
import { Project } from '../abstract/project';
class $Docs extends CommandLineFeature<{}, Project> {
  public async _() {

  }

  async watch() {}
}

export default {
  $Docs: Helpers.CLIWRAP($Docs, '$Docs'),
};
//#endregion
