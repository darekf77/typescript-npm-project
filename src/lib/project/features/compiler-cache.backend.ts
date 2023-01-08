import { _ } from 'tnp-core';
import { FeatureForProject } from '../abstract';

export class CompilerCache extends FeatureForProject {
  get isWatchModeAllowed() {
    return Promise.resolve(false); // TODO
    // return CompilerCache.checkIfPojectHasUpToDateCompiledData(this.project);
  }

  async unsetData() {

  }

  get setUpdatoDate() {
    return {
      frameworkFileGenerator: async () => {

      },
      sourceModifier: async () => {

      },
      join: async () => {

      },
      incrementalBuildProcess: async () => {

      },
    }
  }


}
