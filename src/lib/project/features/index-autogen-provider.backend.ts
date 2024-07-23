import { BaseFeatureForProject } from 'tnp-helpers/src';
import type { Project } from '../abstract/project';
import { BaseCompilerForProject } from '../abstract/base-compiler-for-project.backend';
import { ChangeOfFile } from 'incremental-compiler/src';
import { config, extAllowedToReplace } from 'tnp-config/src';

export class IndexAutogenProvider extends BaseCompilerForProject<{}, Project> {
  constructor(project: Project) {
    super(project, {
      folderPath: project.pathFor(config.folder.src),
      allowedOnlyFileExt: ['.ts', '.tsx'],
    });
  }

  async syncAction(
    absolteFilesPathes?: string[],
    initalParams?: {},
  ): Promise<void> {
    // console.log(absolteFilesPathes);
    // process.exit(0);
  }

  async asyncAction(
    asyncEvents: ChangeOfFile,
    initalParams?: {},
  ): Promise<void> {}
}
