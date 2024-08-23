import { BaseNpmHelpers } from 'tnp-helpers/src';
import type { Project } from './project';
import { CoreModels } from 'tnp-core/src';

export class NpmHelpers extends BaseNpmHelpers<Project> {
  project: Project;
  async makeSureNodeModulesInstalled(
    options?: Omit<CoreModels.NpmInstallOptions, 'pkg'>,
  ) {
    if (this.project.__isStandaloneProject || this.project.__isContainer) {
      // TODO @LAST
      return;
    }
    await super.makeSureNodeModulesInstalled(options);
  }
}
