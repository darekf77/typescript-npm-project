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

  //#region fix map files
  changedJsMapFilesInternalPathesForDebug(
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
    const monitorDir = isTempLocalProj //
      ? this.monitoredOutDir // other package are getting data from temp-local-projecg
      : this.localTempProj.node_modules.pathFor(this.rootPackageName);

    if (isTempLocalProj) {
      this.fixingDtsImports(monitorDir);
    }

    //#region final copy from dist|bundle to node_moules/rootpackagename
    const pkgLocInDestNodeModules = destination.node_modules.pathFor(this.rootPackageName);

    const sourceFolders = [
      config.folder.src,
      config.folder.node_modules,
      config.folder.tempSrcDist,
      config.file.package_json,
    ];
    const filter = Helpers.filterDontCopy(sourceFolders, monitorDir);

    sourceFolders.forEach(sourceFolder => {
      const toRemoveLink = crossPlatformPath(path.join(pkgLocInDestNodeModules, sourceFolder));
      if (Helpers.isSymlinkFileExitedOrUnexisted(toRemoveLink)) {
        Helpers.removeFileIfExists(crossPlatformPath(path.join(pkgLocInDestNodeModules, sourceFolder)));
      }
    })

    Helpers.copy(monitorDir, pkgLocInDestNodeModules, {
      copySymlinksAsFiles: false,
      filter,
    });

    Helpers.writeFile(path.join( // override dts to easly debugging
      pkgLocInDestNodeModules,
      config.file.index_d_ts,
    ), `export * from './${this.project.sourceFolder}';\n`);
    //#endregion
  }
  //#endregion

  //#region fix backend and browser js (m)js.map files (for proper debugging)
  fixBackendAndBrowserJsMapFilesIn() {
    Helpers.log('fixing maps started...')
    const destinationPackageLocation = this.localTempProj.node_modules.pathFor(this.rootPackageName);

    //#region fixing (dist|bundle)/(browser/websql)/**.mjs.map* files
    for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {
      const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];

      const mjsBrowserFilesPattern = `${destinationPackageLocation}/`
        + `${currentBrowserFolder}`
        + `/**/*.mjs.map`;

      const mjsBrwoserFiles = glob.sync(mjsBrowserFilesPattern);

      mjsBrwoserFiles.forEach(absBrowserJsMapFilePath => {
        const relative = crossPlatformPath(absBrowserJsMapFilePath)
          .replace(destinationPackageLocation + '/', '');
        this.writeFixedMapFile(
          true,
          relative,
          destinationPackageLocation);
      });
    }
    //#endregion

    //#region fixing (dist|bundle)/**.js.map* files
    const mapBackendFilesPattern = `${destinationPackageLocation}/**/*.js.map`;
    const mpaBackendFiles = glob.sync(mapBackendFilesPattern,
      { ignore: [`${config.folder.browser}/**/*.*`, `${config.folder.websql}/**/*.*`] })


    mpaBackendFiles.forEach(absBackendMapFilePath => {
      const relative = crossPlatformPath(absBackendMapFilePath)
        .replace(destinationPackageLocation + '/', '')
      this.writeFixedMapFile(
        false,
        relative,
        destinationPackageLocation
      );
    });
    //#endregion
    Helpers.log('fixing maps done...')
  }
  //#endregion

  //#region copy backend and browser jsM (m)js.map files to destination location
  copyBackendAndBrowserJsMapFilesFromLocalProjTo(destination: Project) {
    const destinationPackageLocation = this.localTempProj.node_modules.pathFor(this.rootPackageName);

    const allMjsBrowserFiles = CopyMangerHelpers.browserwebsqlFolders
      .map(currentBrowserFolder => {
        const mjsBrowserFilesPattern = `${destinationPackageLocation}/`
          + `${currentBrowserFolder}`
          + `/**/*.mjs.map`;

        const mjsBrwoserFiles = glob.sync(mjsBrowserFilesPattern);
        return mjsBrwoserFiles;
      })
      .reduce((a, b) => a.concat(b), [])

    const mapBackendFilesPattern = `${destinationPackageLocation}/**/*.js.map`;
    const mapBackendFiles = glob.sync(mapBackendFilesPattern,
      { ignore: [`${config.folder.browser}/**/*.*`, `${config.folder.websql}/**/*.*`] })

    const toCopy = [
      ...allMjsBrowserFiles,
      ...mapBackendFiles,
    ];

    for (let index = 0; index < toCopy.length; index++) {
      const fileAbsPath = toCopy[index];
      const fileRelativePath = fileAbsPath.replace(`${destinationPackageLocation}/`, '');
      const destAbs = crossPlatformPath(path.join(
        destination.location,
        config.folder.node_modules,
        this.rootPackageName,
        fileRelativePath,
      ));
      Helpers.copyFile(fileAbsPath, destAbs, { dontCopySameContent: false });
    }
  }
  //#endregion

  //#region handle copy of single file
  handleCopyOfSingleFile(destination: Project, isTempLocalProj: boolean, specyficFileRelativePath: string): void {
    //#region handle single file

    specyficFileRelativePath = specyficFileRelativePath.replace(/^\//, '');

    const notAllowedFiles = [
      '.DS_Store',
      config.file.index_d_ts,
    ];

    if (notAllowedFiles.includes(specyficFileRelativePath)) {
      return;
    }

    const destinationFilePath = crossPlatformPath(path.normalize(path.join(
      destination.node_modules.pathFor(this.rootPackageName),
      specyficFileRelativePath
    )));

    if (!isTempLocalProj) {
      const readyToCopyFileInLocalTempProj = crossPlatformPath(path.join(
        this.localTempProj.node_modules.pathFor(this.rootPackageName),
        specyficFileRelativePath
      ));
      // Helpers.log(`Eqal content with temp proj: ${}`)
      Helpers.copyFile(readyToCopyFileInLocalTempProj, destinationFilePath);
      return;
    }

    const absFilePathInDistOrBundle = crossPlatformPath(path.normalize(path.join(
      this.project.location,
      this.outDir,
      specyficFileRelativePath
    )));

    let contentToWriteInDestination = (Helpers.readFile(absFilePathInDistOrBundle));

    contentToWriteInDestination = contentToWriteInDestination ? contentToWriteInDestination : '';

    if (path.basename(absFilePathInDistOrBundle).endsWith('.d.ts')) {
      for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {
        const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
        contentToWriteInDestination = CopyMangerHelpers.fixDtsImport(
          contentToWriteInDestination,
          // sourceFile,
          currentBrowserFolder,
          this.isomorphicPackages,
        );
      }
    }

    const isBackendMapsFile = destinationFilePath.endsWith('.js.map');
    const isBrowserMapsFile = destinationFilePath.endsWith('.mjs.map');

    // @LAST check possible js.map becaosue somethimg is not detefced


    if (isBackendMapsFile || isBrowserMapsFile) {
      if (isBackendMapsFile) {
        this.writeFixedMapFile(
          false,
          specyficFileRelativePath,
          destination.node_modules.pathFor(this.rootPackageName),
          contentToWriteInDestination,
        )
      }
      if (isBrowserMapsFile) {
        this.writeFixedMapFile(
          true,
          specyficFileRelativePath,
          destination.node_modules.pathFor(this.rootPackageName),
          contentToWriteInDestination,
        )
      }
    } else {
      Helpers.writeFile(destinationFilePath, contentToWriteInDestination)
    }



    // TODO check this
    if (specyficFileRelativePath === config.file.package_json) {
      // TODO this is VSCODE/typescirpt new fucking issue
      // Helpers.copyFile(sourceFile, path.join(path.dirname(destinationFile), config.folder.browser, path.basename(destinationFile)));
    }
    //#endregion
  }
  //#endregion

}
