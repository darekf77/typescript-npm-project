//#region imports
//#region @backend
import { chalk, chokidar, fse, Utils } from 'tnp-core/src';
//#endregion
import { BaseProject, UtilsMd } from 'tnp-helpers/src';
import { BaseCompilerForProject } from 'tnp-helpers/src';
import { ChangeOfFile } from 'incremental-compiler/src';
import { config } from 'tnp-config/src';
import { BaseDebounceCompilerForProject } from 'tnp-helpers/src';
import { Helpers, UtilsHttp } from 'tnp-helpers/src';
import type { Project } from './project';
import { Models } from '../../models';
import { _, crossPlatformPath, path } from 'tnp-core/src';
import { MagicRenamer, RenameRule } from 'magic-renamer/src';
//#endregion

//#region models / EntrypointFile
type EntrypointFile = {
  title: string;
  relativePath: string;
  // packageName: string;
  contentToWrite?: string;
};
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

  public readonly docsConfigJsonFileName = 'docs-config.jsonc';
  public readonly docsConfigSchema = 'docs-config.schema.json';
  public readonly customDefaultCss = 'custom-default.css';
  public readonly customDefaultJs = 'custom-default.js';
  protected mkdocsServePort: number;
  private linkedAlreadProjects = {};

  //#region fields & getters / docs config current proj abs path
  public get docsConfigCurrentProjAbsPath() {
    //#region @backendFunc
    return this.project.pathFor(this.docsConfigJsonFileName);
    //#endregion
  }
  //#endregion

  //#region fields & getters / docs config
  get config(): Models.DocsConfig {
    //#region @backendFunc
    return this.project.readJson(
      this.docsConfigJsonFileName,
    ) as Models.DocsConfig;
    //#endregion
  }
  //#endregion

  //#region fields & getters / linkd docs to global container
  private linkDocsToGlobalContainer() {
    //#region @backendFunc
    if (!Helpers.exists(path.dirname(this.docsConfigGlobalContainerAbsPath))) {
      Helpers.mkdirp(path.dirname(this.docsConfigGlobalContainerAbsPath));
    }
    try {
      fse.unlinkSync(this.docsConfigGlobalContainerAbsPath);
    } catch (error) {}
    Helpers.createSymLink(
      this.project.pathFor(this.tmpDocsFolderRootDocsDirRelativePath),
      this.docsConfigGlobalContainerAbsPath,
    );

    this.writeGlobalWatcherTimestamp();
    //#endregion
  }
  //#endregion

  //#region fields & getters / tmp docs folder path
  /**
   * mkdocs temp folder
   */
  public readonly tmpDocsFolderRoot: string = `.${config.frameworkName}/temp-docs-folder`;

  public readonly combinedDocsFolder: string = `allmdfiles`;
  get tmpDocsFolderRootDocsDirRelativePath(): string {
    //#region @backendFunc
    return crossPlatformPath([this.tmpDocsFolderRoot, this.combinedDocsFolder]);
    //#endregion
  }

  //#endregion

  //#region fields & getters / out docs folder path
  get outDocsDistFolderAbs() {
    //#region @backendFunc
    return this.project.pathFor([
      this.initalParams.docsOutFolder || `.${config.frameworkName}/docs-dist`,
    ]);
    //#endregion
  }
  //#endregion

  //#region n fields & getters / docs config global container abs path
  get docsConfigGlobalContainerAbsPath() {
    //#region @backendFunc
    const globalContainer = this.project.ins.by(
      'container',
      this.project.__frameworkVersion,
    );
    return globalContainer.pathFor(
      `.${config.frameworkName}/docs-from-projects/${this.project.universalPackageName}`,
    );
    //#endregion
  }
  //#endregion

  //#region fields & getters / docs global timestamp for watcher abs path
  get docsGlobalTimestampForWatcherAbsPath() {
    //#region @backendFunc
    return this.getTimestampWatcherForPackageName(
      this.project.universalPackageName,
    );
    //#endregion
  }
  //#endregion

  //#region n fields & getters / docs config schema path
  get docsConfigSchemaPath(): string {
    //#region @backendFunc
    return this.project.ins
      .by('isomorphic-lib', this.project.__frameworkVersion)
      .pathFor(this.docsConfigSchema);
    //#endregion
  }
  //#endregion

  //#endregion

  //#region constructor
  //#region @backend
  // @ts-ignore
  constructor(project: Project) {
    // @ts-ignore
    this.project = project;
    const timestampContainer = crossPlatformPath(
      // @ts-ignore
      path.dirname(this.docsGlobalTimestampForWatcherAbsPath),
    );
    // console.log('timestampContainer', timestampContainer);
    // process.exit(0);
    super(project, {
      taskName: 'DocsProvider',
      folderPath: project.location,
      ignoreFolderPatter: [
        project.pathFor('tmp-*/**/*.*'),
        project.pathFor('tmp-*'),
        project.pathFor('dist/**/*.*'),
        project.pathFor('dist'),
        project.pathFor('dist-*/**/*.*'),
        project.pathFor('browser/**/*.*'),
        project.pathFor('browser'),
        project.pathFor('websql/**/*.*'),
        project.pathFor('websql'),
        // QUICK_FIX I may include for example .ts files in md files with handlebars
        ...['ts', 'js', 'scss', 'css', 'html'].map(ext =>
          project.pathFor(`src/**/*.${ext}`),
        ),
        project.pathFor('.*/**/*.*'),
        `${timestampContainer}`,
        `${timestampContainer}/**/*.*`,
      ],
      subscribeOnlyFor: ['md', 'yml' as any],
    });
  }
  //#endregion
  //#endregion

  //#region methods / init
  async init() {
    //#region @backendFunc
    this.project.removeFolderByRelativePath(
      this.tmpDocsFolderRootDocsDirRelativePath,
    );
    this.project.createFolder(this.tmpDocsFolderRootDocsDirRelativePath);
    if (!this.project.hasFile(this.docsConfigJsonFileName)) {
      this.project.writeJson(
        this.docsConfigJsonFileName,
        this.defaultDocsConfig(),
      );
    }
    try {
      fse.unlinkSync(this.project.pathFor(this.docsConfigSchema));
    } catch (error) {}
    Helpers.createSymLink(
      this.docsConfigSchemaPath,
      this.project.pathFor(this.docsConfigSchema),
      { continueWhenExistedFolderDoesntExists: true },
    );
    this.project.vsCodeHelpers.recreateJsonSchemaForDocs();

    this.linkDocsToGlobalContainer();

    //#endregion
  }
  //#endregion

  //#region methods / action
  async action({
    changeOfFiles,
    asyncEvent,
  }: {
    changeOfFiles: ChangeOfFile[];
    asyncEvent: boolean;
  }) {
    //#region @backendFunc
    // if (asyncEvent) {
    //   console.log(
    //     'changeOfFiles',
    //     changeOfFiles.map(f => f.fileAbsolutePath),
    //   );
    // }
    // QUICK_FIX
    if (
      asyncEvent &&
      changeOfFiles.length === 1 &&
      _.first(changeOfFiles)?.fileAbsolutePath ===
        this.docsGlobalTimestampForWatcherAbsPath
    ) {
      return;
    }

    if (!asyncEvent) {
      await this.init();
    }

    await this.recreateFilesInTempFolder(asyncEvent);

    if (!asyncEvent) {
      await this.buildMkdocs({ watch: this.isWatchCompilation });

      chokidar
        .watch(this.project.pathFor(this.docsConfigJsonFileName), {
          ignoreInitial: true,
        })
        .on('all', async () => {
          Helpers.info(
            'Docs config changed (docs-config.jsonc).. rebuilding..',
          );
          await this.action({
            changeOfFiles: [],
            asyncEvent: true,
          });
        });

      if (this.initalParams.docsOutFolder) {
        const portForDocs = await this.project.registerAndAssignPort(
          ('docs port for http server'),
          {
            startFrom: 3950,
          },
        );
        await UtilsHttp.startHttpServer(this.outDocsDistFolderAbs, portForDocs);
      }
    }
    if (asyncEvent) {
      this.writeGlobalWatcherTimestamp();
    }
    //#endregion
  }
  //#endregion

  //#region methods / docs config json $schema content
  protected docsConfigSchemaContent(): string {
    //#region @backendFunc
    return Helpers.readFile(this.docsConfigSchemaPath);
    //#endregion
  }
  //#endregion

  //#region private methods

  //#region private methods / default docs config
  private defaultDocsConfig(): Models.DocsConfig {
    //#region @backendFunc
    return {
      site_name: this.project.name,
      // additionalAssets: [], // TODO MAKE IT AUTOMATIC
      externalDocs: {
        mdfiles: [],
        projects: [],
      },
      omitFilesPatters: [],
      priorityOrder: [],
      mapTitlesNames: {
        'README.md': 'Introduction',
      },
      customCssPath: 'custom.css',
      customJsPath: 'custom.js',
    } as Models.DocsConfig;
    //#endregion
  }
  //#endregion

  //#region private methods / apply priority order

  private applyPriorityOrder(files: EntrypointFile[]): EntrypointFile[] {
    //#region @backendFunc
    const orderByPriority = (items: EntrypointFile[], priority: string[]) => {
      return items.sort((a, b) => {
        // Get the index of the 'title' in the priorityOrder array
        const indexA = priority.indexOf(a.title.replace('.md', ''));
        const indexB = priority.indexOf(b.title.replace('.md', ''));

        // If either title is not in the priority order, move it to the end (assign a large index)
        const priorityA = indexA === -1 ? priority.length : indexA;
        const priorityB = indexB === -1 ? priority.length : indexB;

        // Compare by priority order
        return priorityA - priorityB;
      });
    };

    files = orderByPriority(
      files,
      (this.config.priorityOrder || []).map(p => p.replace('.md', '')),
    );

    // Return prioritized files first, followed by the rest
    const omitFilesPatters = this.config.omitFilesPatters || [];
    const result = Utils.uniqArray(
      // [...prioritizedFiles, ...nonPrioritizedFiles]
      files.filter(
        f =>
          f.title &&
          !omitFilesPatters
            .map(a => a.replace('.md', ''))
            .includes(f.title.replace('.md', '')),
      ),
      'relativePath',
    );

    return result as EntrypointFile[];
    //#endregion
  }
  //#endregion

  //#region private methods / mkdocs.yml content
  private mkdocsYmlContent(
    entryPointFilesRelativePaths: EntrypointFile[],
  ): string {
    //#region @backendFunc
    // console.log({
    //   entryPointFilesRelativePaths,
    // });
    // example:
    // - Introduction: introduction/index.md
    // - Setup: setup/index.md
    // - Isomorphic Code: isomorphic-code/index.md
    // - Development: development/index.md
    // - Tutorials: tutorials/index.md
    // - Changelog: changelog/index.md
    // - QA: qa/index.md
    // docs_dir: ./
    return `site_name: ${this.config.site_name ? this.config.site_name : _.upperFirst(this.project.name) + 'Documentation'}
# site_url:  ${this.project.__env.config.domain}
nav:
${this.applyPriorityOrder(entryPointFilesRelativePaths)
  .map(p => {
    if (p.relativePath === p.title) {
      `  - ${_.replace(p.title, /[_\s]/g, ' ')}`;
    }
    return `  - ${_.replace(p.title, /[_\s]/g, ' ')}: ${p.relativePath}`;
  })
  .join('\n')}
docs_dir: ./${this.combinedDocsFolder}
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
  - ${this.config.customCssPath || this.customDefaultCss}

extra_javascript:
  - ${this.config.customJsPath || this.customDefaultJs}

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
    //#endregion
  }
  //#endregion

  //#region private methods / build mkdocs
  private async buildMkdocs({ watch }: { watch: boolean }) {
    //#region @backendFunc
    this.project.setValueToJSONC(
      config.file.package_json,
      'scripts.mkdocs',
      process.platform === 'darwin' ? 'mkdocs' : 'python3 -m mkdocs',
    );
    if (watch) {
      this.mkdocsServePort = await this.project.registerAndAssignPort(
        'mkdocs serve',
        {
          startFrom: 3900,
        },
      );
      // python3 -m
      Helpers.run(
        process.platform === 'darwin'
          ? `mkdocs serve -a localhost:${this.mkdocsServePort} --quiet`
          : //--quiet
            `python3 -m mkdocs serve -a localhost:${this.mkdocsServePort} --quiet`,
        {
          cwd: this.project.pathFor([this.tmpDocsFolderRoot]),
        },
      ).async();
      Helpers.info(
        `Mkdocs server started on  http://localhost:${this.mkdocsServePort}`,
      );
    } else {
      if (!Helpers.exists(this.outDocsDistFolderAbs)) {
        Helpers.mkdirp(this.outDocsDistFolderAbs);
      }
      Helpers.run(
        `python3 -m mkdocs build --site-dir ${this.outDocsDistFolderAbs}`,
        {
          cwd: this.project.pathFor([this.tmpDocsFolderRoot]),
        },
      ).sync();
    }
    //#endregion
  }
  //#endregion

  // TODO @LAST hande @render tag in md files

  //#region private methods / copy files to docs folder
  private copyFilesToTempDocsFolder(
    relativeFilePathesToCopy: string[],
    asyncEvent: boolean,
  ) {
    //#region @backendFunc
    let counterCopy = 0;

    //#region handle custom js/css files
    if (
      this.config.customCssPath &&
      this.project.hasFile(this.config.customCssPath)
    ) {
      Helpers.copyFile(
        this.project.pathFor(this.config.customCssPath),
        this.project.pathFor([
          this.tmpDocsFolderRootDocsDirRelativePath,
          this.config.customCssPath,
        ]),
      );
    } else {
      this.project.writeFile(
        [this.tmpDocsFolderRootDocsDirRelativePath, this.customDefaultCss],
        '',
      );
    }

    if (
      this.config.customJsPath &&
      this.project.hasFile(this.config.customJsPath)
    ) {
      Helpers.copyFile(
        this.project.pathFor(this.config.customJsPath),
        this.project.pathFor([
          this.tmpDocsFolderRootDocsDirRelativePath,
          this.config.customJsPath,
        ]),
      );
    } else {
      this.project.writeFile(
        [this.tmpDocsFolderRootDocsDirRelativePath, this.customDefaultJs],
        '',
      );
    }
    //#endregion

    for (const asbFileSourcePath of relativeFilePathesToCopy) {
      if (
        Helpers.isFolder(asbFileSourcePath) ||
        Helpers.isSymlinkFileExitedOrUnexisted(asbFileSourcePath)
      ) {
        continue;
      }
      const relativeFileSourcePath = this.project.relative(asbFileSourcePath);
      // console.log(
      //   `(${asyncEvent ? 'async' : 'sync'}) Files changed:`,
      //   relativeFileSourcePath,
      // );
      const isNotInRootMdFile =
        path.basename(asbFileSourcePath) !== relativeFileSourcePath;

      if (isNotInRootMdFile) {
        // console.info('repalcign...');
        const contentWithReplacedSomeLinks = UtilsMd.moveAssetsPathesToLevel(
          Helpers.readFile(asbFileSourcePath),
          2,
        );
        // console.info('repalcign done...');
        Helpers.writeFile(
          this.project.pathFor([
            this.tmpDocsFolderRootDocsDirRelativePath,
            relativeFileSourcePath,
          ]),
          contentWithReplacedSomeLinks,
        );
      } else {
        Helpers.copyFile(
          asbFileSourcePath,
          this.project.pathFor([
            this.tmpDocsFolderRootDocsDirRelativePath,
            relativeFileSourcePath,
          ]),
        );
      }

      counterCopy++;
      const assetsFromMdFile = UtilsMd.getAssets(
        Helpers.readFile(asbFileSourcePath),
      );
      // if (path.basename(asbFilePath) === 'QA.md') {
      // console.log(`assets for ${relativeFileSourcePath}`, assetsFromMdFile);
      // }

      // TODO @LAST add assets to watching list
      for (const assetRelativePathFromFile of assetsFromMdFile) {
        const hasSlash = relativeFileSourcePath.includes('/');
        const slash = hasSlash ? '/' : '';
        const relativeAssetPath = relativeFileSourcePath.replace(
          slash + path.basename(relativeFileSourcePath),
          slash + assetRelativePathFromFile,
        );
        const assetSourcetAbsPath = this.project.pathFor(relativeAssetPath);

        const assetDestLocationAbsPath = this.project.pathFor([
          this.tmpDocsFolderRootDocsDirRelativePath,
          relativeAssetPath,
        ]);
        // console.log({
        //   assetRelativePathFromFile,
        //   relativeAssetPath,
        //   relativeFileSourcePath,
        //   assetDestAbsPath: assetSourcetAbsPath,
        //   assetDestLocationAbsPath,
        // });

        // console.log(
        //   `Copy asset ${assetRelativePathFromFile} ${chalk.bold(relativeAssetPath)} to ${assetDestLocationAbsPath}`,
        // );

        Helpers.copyFile(assetSourcetAbsPath, assetDestLocationAbsPath);

        counterCopy++;
      }
    }
    const asyncInfo = asyncEvent
      ? `\nRefreshing http://localhost:${this.mkdocsServePort}..`
      : '';
    Helpers.info(
      `(${asyncEvent ? 'async' : 'sync'}) [${Utils.fullDateTime()}] Copied ${counterCopy} ` +
        `files to temp docs folder. ${asyncInfo}`,
    );
    //#endregion
  }
  //#endregion

  //#region private methods / get root files
  private async getRootFiles(): Promise<EntrypointFile[]> {
    //#region @backendFunc

    return [
      ...Helpers.filesFrom(this.project.location)
        .filter(f => f.toLowerCase().endsWith('.md'))
        .map(f => path.basename(f)),
    ].map(f => ({
      title: f.replace('.md', ''),
      relativePath: f,
      // packageName: this.project.universalPackageName,
    }));
    //#endregion
  }
  //#endregion

  //#region private methods / link project to docs folder
  private linkProjectToDocsFolder(packageName: string) {
    //#region @backendFunc

    if (this.project.universalPackageName === packageName) {
      // Helpers.warn(
      //   `Project ${packageName} is the same as current project ${this.project.universalPackageName}`,
      // );
      return;
    }

    // console.log('packageName', packageName);
    let orgLocation: string;
    try {
      orgLocation = fse.realpathSync(
        crossPlatformPath([
          path.dirname(this.docsConfigGlobalContainerAbsPath),
          packageName,
        ]),
      );
    } catch (error) {
      Helpers.error(
        `Not found "${chalk.bold(packageName)}" in global docs container. ` +
          `Update your externalDocs.project config.`,
        false,
        true,
      );
    }

    const dest = this.project.pathFor([
      this.tmpDocsFolderRootDocsDirRelativePath,
      packageName,
    ]);

    if (Helpers.filesFrom(orgLocation).length === 0) {
      const nearestProj = this.project.ins.nearestTo(orgLocation);
      Helpers.error(
        `Please rebuild docs for this project ${nearestProj?.genericName}.`,
        false,
        true,
      );
    }

    if (!this.linkedAlreadProjects[orgLocation]) {
      try {
        fse.unlinkSync(dest);
      } catch (error) {}
      Helpers.createSymLink(orgLocation, dest);

      // TODO unlink watcher when project no longer in docs-config.json
      Helpers.info(`Listening changes of external project "${packageName}"..`);
      chokidar
        .watch(this.getTimestampWatcherForPackageName(packageName), {
          ignoreInitial: true,
        })
        .on('all', () => {
          Helpers.info(
            `Docs changed  in external project "${chalk.bold(packageName)}".. rebuilding..`,
          );
          this.action({
            changeOfFiles: [],
            asyncEvent: true,
          });
        });
    }

    this.linkedAlreadProjects[orgLocation] = true;
    //#endregion
  }
  //#endregion

  //#region private methods / resolve package data from
  private resolvePackageDataFrom(packageNameWithPath: string): {
    /**
     * global linked package name
     */
    packageName: string;
    /**
     * relative path of the file
     */
    destRelativePath: string;
  } {
    //#region @backendFunc

    const isRelativePath =
      packageNameWithPath.startsWith('../') &&
      packageNameWithPath.startsWith('./');

    const isNpmOrgPath = packageNameWithPath.startsWith('@');
    // const isNormalNpmPackagePath = !isRelativePath && !isNpmOrgPath;
    if (isRelativePath) {
      Helpers.error(
        `Relative pathes are not supported: ${this.docsConfigCurrentProjAbsPath}`,
        false,
        true,
      );
    }

    const packageName = isNpmOrgPath
      ? packageNameWithPath.split('/').slice(0, 2).join('/')
      : _.first(packageNameWithPath.split('/'));

    this.linkProjectToDocsFolder(packageName);

    const destRelativePath = packageNameWithPath
      .replace(packageName + '/', '')
      .replace(packageName, '');

    return { packageName, destRelativePath };
    //#endregion
  }
  //#endregion

  //#region private methods / process md files
  private async getExternalMdFiles(): Promise<EntrypointFile[]> {
    //#region @backendFunc
    const externalMdFiles: EntrypointFile[] = [];
    const externalMdFies = this.config.externalDocs.mdfiles;

    for (const file of externalMdFies) {
      const { packageName, destRelativePath } = this.resolvePackageDataFrom(
        file.packageNameWithPath,
      );

      const sourceAbsPath = fse.realpathSync(
        crossPlatformPath([
          path.dirname(this.docsConfigGlobalContainerAbsPath),
          packageName,
          destRelativePath,
        ]),
      );

      const destinationAbsPath = this.project.pathFor([
        this.tmpDocsFolderRootDocsDirRelativePath,
        packageName,
        destRelativePath,
      ]);

      const destMagicRelativePath = file.overrideTitle
        ? file.overrideTitle + '.md'
        : crossPlatformPath([packageName, destRelativePath])
            .split('/')
            .map(p => _.kebabCase(p.replace('.md', '')))
            .join('__') + '.md';

      const destinationMagicAbsPath = this.project.pathFor([
        this.tmpDocsFolderRootDocsDirRelativePath,
        destMagicRelativePath,
      ]);

      Helpers.copyFile(sourceAbsPath, destinationAbsPath);

      if (file.magicRenameRules) {
        let content = Helpers.readFile(destinationAbsPath);
        const rules = RenameRule.from(file.magicRenameRules);
        for (const rule of rules) {
          content = rule.replaceInString(content);
        }
        Helpers.writeFile(destinationMagicAbsPath, content);
      }

      externalMdFiles.push({
        // packageName,
        relativePath: file.magicRenameRules
          ? destMagicRelativePath
          : crossPlatformPath([packageName, destRelativePath]),
        title: file.overrideTitle
          ? file.overrideTitle
          : destRelativePath.replace('.md', ''),
      });
    }
    return externalMdFiles;
    //#endregion
  }
  //#endregion

  //#region private methods / get/process externalDocs.projects files
  private async getProjectsFiles(): Promise<EntrypointFile[]> {
    //#region @backendFunc

    return (this.config.externalDocs.projects || []).map(p => {
      const {
        packageName: firstPackageName,
        destRelativePath: firstDestRelativePath,
      } = this.resolvePackageDataFrom(
        Array.isArray(p.packageNameWithPath)
          ? _.first(p.packageNameWithPath)
          : p.packageNameWithPath,
      );

      let title: string = p.overrideTitle
        ? p.overrideTitle
        : crossPlatformPath([firstPackageName, firstDestRelativePath]);

      if (Array.isArray(p.packageNameWithPath)) {
        const joinEntrypointName = p.overrideTitle
          ? p.overrideTitle + '.md'
          : p.packageNameWithPath
              .map(p => _.snakeCase(p.replace('.md', '')))
              .join('__') + '.md';

        return {
          title,
          relativePath: joinEntrypointName,
          // packageName: p.packageName,
          contentToWrite: p.packageNameWithPath
            .map(singlePackageNameWithPath => {
              const { packageName, destRelativePath } =
                this.resolvePackageDataFrom(singlePackageNameWithPath);

              const orgLocation =
                this.project.universalPackageName === packageName
                  ? this.project.pathFor(
                      this.tmpDocsFolderRootDocsDirRelativePath,
                    )
                  : fse.realpathSync(
                      crossPlatformPath([
                        path.dirname(this.docsConfigGlobalContainerAbsPath),
                        packageName,
                      ]),
                    );

              let fileContent = Helpers.readFile([
                orgLocation,
                destRelativePath,
              ]);
              const exterFileConfig = this.config.externalDocs.mdfiles.find(
                f => f.packageNameWithPath === singlePackageNameWithPath,
              );
              if (exterFileConfig?.magicRenameRules) {
                const rules = RenameRule.from(exterFileConfig.magicRenameRules);
                for (const rule of rules) {
                  fileContent = rule.replaceInString(fileContent);
                }
              }
              return fileContent;
            })
            .join('\n'),
        };
      }
      return {
        title,
        // packageName: p.packageName,
        relativePath:
          `${firstPackageName}/` +
          `${firstDestRelativePath ? firstDestRelativePath : 'README.md'}`,
      };
    });
    //#endregion
  }
  //#endregion

  //#region private methods / recreate files in temp folder
  private async recreateFilesInTempFolder(asyncEvent: boolean) {
    //#region @backendFunc
    const files: string[] = this.exitedFilesAbsPathes;
    this.copyFilesToTempDocsFolder(files, asyncEvent);

    let rootFiles = await this.getRootFiles();
    const externalMdFiles = await this.getExternalMdFiles();
    const projectsFiles = await this.getProjectsFiles();
    const mapTitlesNames = this.config.mapTitlesNames || {};
    // Object.keys(mapTitlesNames).forEach(k => {
    //   mapTitlesNames[k] = mapTitlesNames[k].replace('.md', '');
    // });

    const allFiles = [...rootFiles, ...externalMdFiles, ...projectsFiles].map(
      //#region allow own packages redirection
      // QUICKFIX
      f => {
        if (
          f.relativePath.startsWith(`${this.project.universalPackageName}/`)
        ) {
          f.relativePath = f.relativePath.replace(
            `${this.project.universalPackageName}/`,
            '',
          );
        }
        if (mapTitlesNames[f.title]) {
          f.title = mapTitlesNames[f.title];
        } else if (mapTitlesNames[f.title.replace('.md', '')]) {
          f.title = mapTitlesNames[f.title.replace('.md', '')];
        } else if (mapTitlesNames[f.title + '.md']) {
          f.title = mapTitlesNames[f.title + '.md'];
        }
        return f;
      },
      //#endregion
    );

    //#region write join entrypoint files
    for (const projectFile of allFiles) {
      if ('contentToWrite' in projectFile) {
        this.project.writeFile(
          [this.tmpDocsFolderRootDocsDirRelativePath, projectFile.relativePath],
          projectFile.contentToWrite,
        );
      }
    }
    //#endregion

    this.project.writeFile(
      [this.tmpDocsFolderRoot, 'mkdocs.yml'],
      this.mkdocsYmlContent(allFiles),
    );
    //#endregion
  }
  //#endregion

  //#region private methods / write global watcher timestamp
  private writeGlobalWatcherTimestamp() {
    //#region @backendFunc
    Helpers.writeFile(
      this.docsGlobalTimestampForWatcherAbsPath,
      new Date().getTime().toString(),
    );
    //#endregion
  }
  //#endregion

  //#region private methods / get timestamp watcher for package name

  private getTimestampWatcherForPackageName(universalPackageName: string) {
    //#region @backendFunc
    const globalContainer = this.project.ins.by(
      'container',
      this.project.__frameworkVersion,
    );
    return globalContainer.pathFor(
      `.${config.frameworkName}/watcher-timestamps-for/${universalPackageName}`,
    );
    //#endregion
  }
  //#endregion

  //#endregion
}
