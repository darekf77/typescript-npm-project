import { BaseFeatureForProject } from 'tnp-helpers/src';
import type { Project } from '../abstract/project';
import { BaseCompilerForProject } from '../abstract/base-compiler-for-project.backend';
import { ChangeOfFile } from 'incremental-compiler/src';
import { config, extAllowedToReplace } from 'tnp-config/src';

export class DocsProvider extends BaseCompilerForProject<{}, Project> {
  tempFolder = 'tmp-mkdoc-docs';
  constructor(project: Project) {
    super(project, {
      taskName: 'DocsProvider',
      folderPath: project.location,
      ignoreFolderPatter: [
        project.pathFor('tmp-*/**/*.*'),
        project.pathFor('tmp-*'),
        project.pathFor('dist/**/*.*'),
        project.pathFor('dist'),
        project.pathFor('browser/**/*.*'),
        project.pathFor('browser'),
        project.pathFor('websql/**/*.*'),
        project.pathFor('websql'),
      ],
      subscribeOnlyFor: ['md'],
    });
  }

  async syncAction(
    absolteFilesPathes?: string[],
    initalParams?: {},
  ): Promise<void> {
    console.log(`Founded files ${absolteFilesPathes.length}`);
    // if (absolteFilesPathes.length < 10) {
    console.log(absolteFilesPathes);
    // }
  }

  async asyncAction(
    asyncEvents: ChangeOfFile,
    initalParams?: {},
  ): Promise<void> {
    console.log('asyncAction', asyncEvents.fileAbsolutePath);
  }
}
