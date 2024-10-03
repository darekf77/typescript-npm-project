//#region imports
import { BaseProject } from 'tnp-helpers/src';
import { BaseCompilerForProject } from 'tnp-helpers/src';
import { ChangeOfFile } from 'incremental-compiler/src';
import { config } from 'tnp-config/src';
import { BaseDebounceCompilerForProject } from 'tnp-helpers/src';
import { Helpers } from 'tnp-helpers/src';
import type { Project } from './project';
import { Models } from '../../models';
import { _ } from 'tnp-core/src';
//#endregion

export class Docs extends BaseDebounceCompilerForProject<
  {
    disableMkdocsCompilation?: boolean;
    /**
     * Relative or absolute (TODO) path to the folder where the docs will be generated
     */
    docsOutFolder?: string;
  },
  Project
> {
  //#region fields & getters

  //#region fields & getters / docs config path
  public readonly docsConfig = 'docs-config.jsonc';
  public readonly docsConfigSchema = 'docs-config.schema.json';

  //#endregion

  //#region fields & getters / tmp docs folder path
  /**
   * mkdocs temp folder
   */
  public readonly tmpDocsFolder = `.${config.frameworkName}/temp-docs-folder/docs`;
  //#endregion

  //#region fields & getters / out docs folder path
  get outDocsFolderRelative() {
    //#region @backendFunc
    return (
      this.initalParams.docsOutFolder || `.${config.frameworkName}/docs-dist`
    );
    //#endregion
  }
  //#endregion

  //#endregion

  //#region constructor
  //#region @backend
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
        project.pathFor('.*/**/*.*'),
      ],
      subscribeOnlyFor: ['md'],
    });
  }
  //#endregion
  //#endregion

  //#region methods

  //#region methods / get docs config json $schema
  protected docsConfigSchemaContent(): string {
    //#region @backendFunc
    return this.project.ins
      .by('isomorphic-lib', this.project.__frameworkVersion)
      .readFile(this.project.docs.docsConfigSchema);
    //#endregion
  }
  //#endregion

  //#region methods / defaultDocsConfig
  protected defaultDocsConfig(): Models.DocsConfig {
    //#region @backendFunc
    return {
      site_name: this.project.name,
      additionalAssets: [],
      externalDocs: {
        mdfiles: [],
        projects: [],
      },
      omitFilesPatters: [],
      priorityOrder: [],
    } as Models.DocsConfig;
    //#endregion
  }
  //#endregion

  //#region methods / mkdocsYmlContent
  mkdocsYmlContent(entryPointFilesRelativePaths: string[]): string {
    console.log({
      entryPointFilesRelativePaths,
    });
    // TODO @LAST
    // - Introduction: introduction/index.md
    // - Setup: setup/index.md
    // - Isomorphic Code: isomorphic-code/index.md
    // - Development: development/index.md
    // - Tutorials: tutorials/index.md
    // - Changelog: changelog/index.md
    // - QA: qa/index.md
    // docs_dir: ./
    return `site_name: Taon Documentation
# site_url: https://firedev.io/documentation
nav:
${entryPointFilesRelativePaths.map(p => `  - ${_.upperCase(p)}: ${p}`).join('\n')}
docs_dir: ./docs
theme:
  name: material
  features:
    - navigation.tabs
    - navigation.sections
    - toc.integrate
    - navigation.top
    - search.suggest
    - search.highlight
    - content.tabs.link
    - content.code.annotation
    - content.code.copy
  language: en
  palette:
    primary: custom
    accent: custom
    # - scheme: default
    #   toggle:
    #     icon: material/toggle-switch-off-outline
    #     name: Switch to dark mode
    # primary: red
    # accent: red
    # - scheme: slate
    #   toggle:
    #     icon: material/toggle-switch
    #     name: Switch to light mode
    # primary: red
    # accent: red

extra_css:
  - stylesheets/extra.css

extra_javascript:
  - javascripts/extra.js

# plugins:
#   - social

# extra:
#   social:
#     - icon: fontawesome/brands/github-alt
#       link: https://github.com/james-willett
#     - icon: fontawesome/brands/twitter
#       link: https://twitter.com/TheJamesWillett
#     - icon: fontawesome/brands/linkedin
#       link: https://www.linkedin.com/in/willettjames/

markdown_extensions:
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.inlinehilite
  - pymdownx.snippets
  - admonition
  - pymdownx.arithmatex:
      generic: true
  - footnotes
  - pymdownx.details
  - pymdownx.superfences
  - pymdownx.mark
  - attr_list
  # - pymdownx.emoji:
  #     emoji_index: !!python/name:materialx.emoji.twemoji
  #     emoji_generator: !!python/name:materialx.emoji.to_svg

  `;
  }
  //#endregion

  //#region methods / build mkdocs
  private async buildMkdocs({ watch }: { watch: boolean }) {
    //#region @backendFunc
    if (watch) {
      const mkdocsServePort = await this.project.assignFreePort(3900);
      // python3 -m
      Helpers.run(`mkdocs serve -a localhost:${mkdocsServePort} --quiet`, {
        cwd: this.project.pathFor([this.tmpDocsFolder, '..']),
      }).async();
    } else {
      Helpers.run(
        `mkdocs build --site-dir ../../${this.outDocsFolderRelative}`,
        {
          cwd: this.project.pathFor([this.tmpDocsFolder, '..']),
        },
      ).sync();
    }
    //#endregion
  }
  //#endregion

  //#region methods/ action
  async action({
    changeOfFiles,
    asyncEvent,
  }: {
    changeOfFiles: ChangeOfFile[];
    asyncEvent: boolean;
  }) {
    //#region @backendFunc
    const files = changeOfFiles.map(f => f.fileAbsolutePath);
    // console.log({ files });
    // console.log('initalParams', this.initalParams);
    if (!asyncEvent) {
      //#region sync init
      if (!this.project.hasFolder(this.tmpDocsFolder)) {
        this.project.createFolder(this.tmpDocsFolder);
      }
      if (!this.project.hasFile(this.docsConfig)) {
        this.project.writeJson(this.docsConfig, this.defaultDocsConfig());
      }
      if (!this.project.hasFile(this.docsConfigSchema)) {
        this.project.writeFile(
          this.docsConfigSchema,
          this.docsConfigSchemaContent(),
        );
      }
      this.project.vsCodeHelpers.recreateJsonSchemaForDocs();
      this.project.writeFile(
        [this.tmpDocsFolder, '../mkdocs.yml'],
        this.mkdocsYmlContent(
          files
            .map(f => this.project.relative(f))
            .filter(f => f.split('/').length === 1 && f.endsWith('.md')),
        ),
      );

      //#endregion
    }

    //#region copy files
    for (const asbFilePath of files) {
      const relativePath = this.project.relative(asbFilePath);
      console.log(
        `(${asyncEvent ? 'async' : 'sync'}) Files changed:`,
        relativePath,
      );
      Helpers.copyFile(
        asbFilePath,
        this.project.pathFor([this.tmpDocsFolder, relativePath]),
      );
    }
    //#endregion

    await this.buildMkdocs({ watch: this.isWatchCompilation });

    //#endregion
  }
  //#endregion

  //#endregion
}
