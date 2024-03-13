import { _ } from 'tnp-core/src';
import { FeatureForProject } from '../abstract/feature-for-project';

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
