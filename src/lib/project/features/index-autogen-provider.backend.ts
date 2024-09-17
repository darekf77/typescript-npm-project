import { BaseFeatureForProject } from 'tnp-helpers/src';
import type { Project } from '../abstract/project';
import { BaseCompilerForProject } from '../abstract/base-compiler-for-project.backend';
import { ChangeOfFile } from 'incremental-compiler/src';
import { config, extAllowedToReplace } from 'tnp-config/src';
import { UtilsTypescript } from 'tnp-helpers/src';
import { crossPlatformPath, Helpers, _, path } from 'tnp-core/src';

export class IndexAutogenProvider extends BaseCompilerForProject<{}, Project> {
  public readonly propertyInTaonJsonc = 'shouldGenerateAutogenIndexFile';
  constructor(project: Project) {
    super(project, {
      folderPath: project.pathFor([config.folder.src, config.folder.lib]),
      subscribeOnlyFor: ['ts', 'tsx'],
      taskName: 'IndexAutogenProvider',
    });
  }

  get indexAutogenFileRelativePath() {
    return crossPlatformPath([
      config.folder.src,
      config.folder.lib,
      config.file.index_generated_ts,
    ]);
  }

  private exportsToSave: string[] = [];

  private processFile(absFilePath: string, writeAsync = false) {
    if (!Helpers.isFolder(absFilePath)) {
      const exportsFounded = UtilsTypescript.exportsFromFile(absFilePath);
      const exportString =
        `export * from ` +
        `'./${absFilePath
          .replace(this.project.location + '/src/lib/', '')
          .replace(path.extname(absFilePath), '')}';`;

      if (exportsFounded.length > 0) {
        if (!this.exportsToSave.includes(exportString)) {
          this.exportsToSave.push(exportString);
        }
      } else {
        this.exportsToSave = this.exportsToSave.filter(e => e !== exportString);
      }
      if (writeAsync) {
        this.debounceWrite();
      }
    }
  }

  public writeIndexFile(isPlaceholderOnly = false) {
    this.project.writeFile(
      this.indexAutogenFileRelativePath,

      `// @ts-no${'check'}
// This file is auto-generated. Do not modify.
// ${
        isPlaceholderOnly
          ? `This is only placholder.` +
            `\n// Use property "${this.propertyInTaonJsonc}: true" ` +
            `\n// in ${config.file.taon_jsonc} to enable autogeneration.`
          : `This disable this auto generate file.` +
            `\n// set property "${this.propertyInTaonJsonc}: false" ` +
            `\n// in ${config.file.taon_jsonc} of your project.`
      } \n` + this.exportsToSave.join('\n'),
    );
  }

  private debounceWrite = _.debounce(() => {
    this.writeIndexFile();
  }, 1000);

  async syncAction(
    absolteFilesPathes?: string[],
    initalParams?: {},
  ): Promise<void> {
    Helpers.logInfo(
      `IndexAutogenProvider for project: ${this.project.genericName}`,
    );
    for (const absFilePath of absolteFilesPathes) {
      this.processFile(absFilePath);
    }
    this.writeIndexFile();
    Helpers.taskDone(
      `IndexAutogenProvider for project: ${this.project.genericName}`,
    );
  }

  async asyncAction(
    asyncEvents: ChangeOfFile,
    initalParams?: {},
  ): Promise<void> {
    this.processFile(asyncEvents.fileAbsolutePath, true);
  }
}
