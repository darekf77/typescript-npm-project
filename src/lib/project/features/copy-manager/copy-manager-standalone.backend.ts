import { config } from "tnp-config";
import { crossPlatformPath, glob, path, _ } from "tnp-core";
import { BuildOptions } from "tnp-db";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import { CLASS } from "typescript-class-helpers";
import { Project } from "../../abstract/project/project";
import { CopyMangerHelpers } from "./copy-manager-helpers.backend";
import { CopyManager } from "./copy-manager.backend";

@CLASS.NAME('CopyManagerStandalone')
export class CopyManagerStandalone extends CopyManager {

  //#region init
  public init(
    buildOptions: BuildOptions,
    renameDestinationFolder?: string,
  ) {
    super.init(buildOptions, renameDestinationFolder);
    const monitoredOutDir = this.monitoredOutDir;

    const toMonitorBrowser = CopyMangerHelpers.browserwebsqlFolders
      .map(currentBrowserFolder => path.join(monitoredOutDir, currentBrowserFolder));

    this.initOptions({
      folderPath: [
        path.join(monitoredOutDir, config.file.package_json),
        path.join(monitoredOutDir, config.file.index_d_ts),
        path.join(monitoredOutDir, config.file.index_js),
        path.join(monitoredOutDir, config.file.index_js_map),
        path.join(monitoredOutDir, config.folder.lib),

        ...toMonitorBrowser,
      ],
      folderPathContentCheck: [
        path.join(monitoredOutDir, config.folder.lib),
        ...toMonitorBrowser,
      ]
    });
  }
  //#endregion

  //#region local temp proj path
  get localTempProjPath() {
    const localProjPath = crossPlatformPath(path.join(this.project.location, this.tempProjName));
    return localProjPath;
  }
  //#endregion

  //#region root package name
  /**
   * first folder in node_modules for packge
   * example:
   * project/node_modules/<rootPackageName> # like 'ng2-rest' or '@angular'
   */
  get rootPackageName() {
    const rootPackageName = ((_.isString(this.renameDestinationFolder) && this.renameDestinationFolder !== '')
      ? this.renameDestinationFolder
      : (this.project.name)
    );
    return rootPackageName;
  }
  //#endregion

  //#region monitored out dir
  get monitoredOutDir(): string {
    const monitorDir: string = crossPlatformPath(path.join(this.project.location, this.outDir));
    return monitorDir;
  }
  //#endregion

  //#region get children
  getChildren(): Project[] {
    return [];
  }
  //#endregion

  //#region get source folder
  getSourceFolder(
    monitorDir: string,
    currentBrowserFolder: Models.dev.BuildDirBrowser,
    isTempLocalProj: boolean
  ) {
    const sourceBrowser = crossPlatformPath(
      isTempLocalProj
        ? path.join(path.dirname(monitorDir), currentBrowserFolder)
        : path.join(
          this.localTempProjPath,
          config.folder.node_modules,
          this.rootPackageName,
          currentBrowserFolder,
        ));
    return sourceBrowser;
  };
  //#endregion

  //#region initial fix for destination pacakge
  initalFixForDestination(destination: Project): void {

    const destPackageInNodeModules = path.join(
      destination.location,
      config.folder.node_modules,
      this.rootPackageName
    );

    for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {
      const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
      const destPackageInNodeModulesBrowser = path.join(destPackageInNodeModules, currentBrowserFolder);


      if (Helpers.isSymlinkFileExitedOrUnexisted(destPackageInNodeModules)) {
        Helpers.removeFileIfExists(destPackageInNodeModules);
      }
      if (!Helpers.exists(destPackageInNodeModules)) {
        Helpers.mkdirp(destPackageInNodeModules);
      }
      if (Helpers.isSymlinkFileExitedOrUnexisted(destPackageInNodeModulesBrowser)) {
        Helpers.removeFileIfExists(destPackageInNodeModulesBrowser);
      }
      if (!Helpers.exists(destPackageInNodeModulesBrowser)) {
        Helpers.mkdirp(destPackageInNodeModulesBrowser);
      }
    }
  }
  //#endregion

  //#region transform map files
  transformMapFile(
    content: string,
    isBrowser: boolean,
    isForCliDebuggerToWork?: boolean,
  ): string {

    let toReplaceString2 = isBrowser
      ? `../tmp-libs-for-${this.outDir}/${this.project.name}/projects/${this.project.name}/${config.folder.src}`
      : `../tmp-source-${this.outDir}`;

    let toReplaceString1 = `"${toReplaceString2}`;


    if (isBrowser) { // TODO replace browser doesnt make sense ?? - for now yes
      // content = content.replace(regex1, `"./${config.folder.src}`);
      // content = content.replace(regex2, config.folder.src);
    } else {
      if (isForCliDebuggerToWork) {
        const regex2 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString2), 'g');
        content = content.replace(regex2, `../${config.folder.src}`);
      } else {
        const regex1 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString1), 'g');
        const regex2 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString2), 'g');
        content = content.replace(regex1, `"./${config.folder.src}`);
        content = content.replace(regex2, config.folder.src);
      }
    }

    return content;
  }
  //#endregion

  //#region copy compiled sources and declarations
  copyCompiledSourcesAndDeclarations(destination: Project, isTempLocalProj: boolean) {

    const monitorDir = isTempLocalProj
      ? this.monitoredOutDir
      : this.localTempProjectPathes.package(this.rootPackageName);

    for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {

      const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
      const sourceBrowser = this.getSourceFolder(monitorDir, currentBrowserFolder, isTempLocalProj);

      if (isTempLocalProj) {
        Helpers.log('Fixing .d.ts. files start...')
        const browserDtsFiles = Helpers.filesFrom(sourceBrowser, true).filter(f => f.endsWith('.d.ts'));
        for (let index = 0; index < browserDtsFiles.length; index++) {
          const dtsFileAbsolutePath = browserDtsFiles[index];
          const dtsFileContent = Helpers.readFile(dtsFileAbsolutePath);
          const dtsFixedContent = CopyMangerHelpers.fixDtsImport(
            dtsFileContent,
            dtsFileAbsolutePath,
            currentBrowserFolder,
            this.isomorphicPackages
          );
          if (dtsFileAbsolutePath.trim() !== dtsFileContent.trim()) {
            Helpers.writeFile(dtsFileAbsolutePath, dtsFixedContent);
          }
        }
        Helpers.log('Fixing .d.ts. files done.')
      }
    }

    const sourceFolders = [
      config.folder.src,
      config.folder.node_modules,
      config.folder.tempSrcDist,
      config.file.package_json,
    ];
    const filter = Helpers.filterDontCopy(sourceFolders, monitorDir);

    sourceFolders.forEach(sourceFolder => {
      const toRemoveLink = crossPlatformPath(path.join(destination.location, sourceFolder));
      if (Helpers.isSymlinkFileExitedOrUnexisted(toRemoveLink)) {
        Helpers.removeFileIfExists(crossPlatformPath(path.join(destination.location, sourceFolder)));
      }
    })

    Helpers.copy(monitorDir, destination.location, {
      copySymlinksAsFiles: false,
      filter,
    });

    Helpers.writeFile(path.join( // override dts to easly debugging
      destination.location,
      config.file.index_d_ts,
    ), `export * from './${this.project.sourceFolder}';\n`);
  }
  //#endregion

  //#region copy source maps
  copySourceMaps(destination: Project, isTempLocalProj: boolean): void {

    if (isTempLocalProj) {

      for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {
        const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
        Helpers.log('fixing js.maps started...')
        const mjsBrowserFilesPattern = `${destination.location}/`
          + `${currentBrowserFolder}`
          + `/**/*.mjs.map`;

        const mjsBrwoserFiles = glob.sync(mjsBrowserFilesPattern);


        mjsBrwoserFiles.forEach(f => {
          let orgContent = Helpers.readFile(f);
          Helpers.writeFile(f, this.transformMapFile(orgContent, true));

          const monitoredOutDirFileToReplaceBack = path.join(
            this.monitoredOutDir,
            crossPlatformPath(f).replace(this.localTempProjectPathes.package(this.rootPackageName), ''),
          );

          Helpers.writeFile(
            monitoredOutDirFileToReplaceBack,
            this.transformMapFile(orgContent, true, true),
          );

        });
      }

      const mapBackendFilesPattern = `${destination.location}/**/*.js.map`;
      const mpaBackendFiles = glob.sync(mapBackendFilesPattern,
        { ignore: [`${config.folder.browser}/**/*.*`, `${config.folder.websql}/**/*.*`] })


      mpaBackendFiles.forEach(f => {
        let orgContent = Helpers.readFile(f);
        Helpers.writeFile(f, this.transformMapFile(orgContent, false));

        const monitoredOutDirFileToReplaceBack = path.join(
          this.monitoredOutDir,
          crossPlatformPath(f).replace(this.localTempProjectPathes.package(this.rootPackageName), ''),
        );

        Helpers.writeFile(
          monitoredOutDirFileToReplaceBack,
          this.transformMapFile(orgContent, false, true)
        );

      });
      Helpers.log('fixing js.maps done...')

    } else {

      const localTempProjOutFolder = this.localTempProjectPathes.package(this.rootPackageName);

      const allMjsBrowserFiles = CopyMangerHelpers.browserwebsqlFolders.map(currentBrowserFolder => {
        const mjsBrowserFilesPattern = `${localTempProjOutFolder}/`
          + `${currentBrowserFolder}`
          + `/**/*.mjs.map`;

        const mjsBrwoserFiles = glob.sync(mjsBrowserFilesPattern);
        return mjsBrwoserFiles;
      }).reduce((a, b) => a.concat(b), [])



      const mapBackendFilesPattern = `${localTempProjOutFolder}/**/*.js.map`;
      const mapBackendFiles = glob.sync(mapBackendFilesPattern,
        { ignore: [`${config.folder.browser}/**/*.*`, `${config.folder.websql}/**/*.*`] })


      const toCopy = [
        ...allMjsBrowserFiles,
        ...mapBackendFiles,
      ];

      for (let index = 0; index < toCopy.length; index++) {
        const fileAbsPath = toCopy[index];
        const fileRelativePath = fileAbsPath.replace(`${localTempProjOutFolder}/`, '');
        const destAbs = crossPlatformPath(path.join(
          destination.location,
          config.folder.node_modules,
          this.rootPackageName,
          fileRelativePath,
        ));
        Helpers.copyFile(fileAbsPath, destAbs, { dontCopySameContent: false });
      }

    }

  }
  //#endregion

  //#region handle copy of single file
  handleCopyOfSingleFile(destination: Project, isTempLocalProj: boolean, specyficFileRelativePath: string): void {
    //#region handle single file

    const notAllowedFiles = [
      '.DS_Store',
      config.file.index_d_ts,
    ];

    let destinationFile = crossPlatformPath(path.normalize(path.join(
      destination.location,
      config.folder.node_modules,
      this.rootPackageName,
      specyficFileRelativePath
    )));

    const relativePath = specyficFileRelativePath.replace(/^\//, '');

    if (notAllowedFiles.includes(relativePath)) {
      return;
    }

    const sourceFileInLocalTempFolder = crossPlatformPath(path.join(
      this.localTempProjectPathes.package(this.rootPackageName),
      specyficFileRelativePath
    ));

    if (!isTempLocalProj) {
      // Helpers.log(`Eqal content with temp proj: ${}`)
      Helpers.copyFile(sourceFileInLocalTempFolder, destinationFile);
      return;
    }

    const sourceFile = crossPlatformPath(path.normalize(path.join(
      this.project.location,
      this.outDir,
      specyficFileRelativePath
    )));

    let contentToWriteInDestination = (Helpers.readFile(sourceFile));

    contentToWriteInDestination = contentToWriteInDestination ? contentToWriteInDestination : '';

    if (path.basename(sourceFile).endsWith('.d.ts')) {
      for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {
        const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
        contentToWriteInDestination = CopyMangerHelpers.fixDtsImport(
          contentToWriteInDestination,
          sourceFile,
          currentBrowserFolder,
          this.isomorphicPackages,
        );
      }
    }

    if (this.watch || isTempLocalProj) {
      const isBackendMapsFile = destinationFile.endsWith('.js.map');
      const isBrowserMapsFile = destinationFile.endsWith('.mjs.map');

      if (isBackendMapsFile || isBrowserMapsFile) {
        if (isBackendMapsFile) {
          contentToWriteInDestination = this.transformMapFile(
            contentToWriteInDestination, false
          );

          if (isTempLocalProj) {
            const monitoredOutDirFileToReplaceBack = crossPlatformPath(path.join(
              this.monitoredOutDir,
              crossPlatformPath(sourceFile).replace(this.monitoredOutDir, ''),
            ));


            Helpers.writeFile(monitoredOutDirFileToReplaceBack, this.transformMapFile(
              contentToWriteInDestination, false, true
            ));
          }

        }
        if (isBrowserMapsFile) {
          contentToWriteInDestination = this.transformMapFile(
            contentToWriteInDestination, true
          );

          if (isTempLocalProj) {
            const monitoredOutDirFileToReplaceBack = crossPlatformPath(path.join(
              this.monitoredOutDir,
              crossPlatformPath(sourceFile).replace(this.monitoredOutDir, ''),
            ));

            Helpers.writeFile(monitoredOutDirFileToReplaceBack, this.transformMapFile(
              contentToWriteInDestination, true, true
            ));
          }


        }
      }
    }

    Helpers.writeFile(destinationFile, contentToWriteInDestination);

    // TODO check this
    if (relativePath === config.file.package_json) {
      // TODO this is VSCODE/typescirpt new fucking issue
      // Helpers.copyFile(sourceFile, path.join(path.dirname(destinationFile), config.folder.browser, path.basename(destinationFile)));
    }
    //#endregion
  }
  //#endregion

}
