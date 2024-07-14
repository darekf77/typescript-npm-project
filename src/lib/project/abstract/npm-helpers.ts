import { BaseNpmHelpers } from 'tnp-helpers/src';
import type { Project } from './project';

export class NpmHelpers extends BaseNpmHelpers<Project> {
  project: Project;
  async makeSureNodeModulesInstalled(options?: {
    useYarn?: boolean;
    force?: boolean;
  }) {
    if (this.project.__isStandaloneProject || this.project.__isContainer) {
      // TODO @LAST
      return;
    }
    await super.makeSureNodeModulesInstalled(options);
  }
}
