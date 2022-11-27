import { config } from "tnp-config";
import { crossPlatformPath, glob, path, _ } from "tnp-core";
import { BuildOptions } from "tnp-db";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import { CLASS } from "typescript-class-helpers";
import { Project } from "../../abstract/project/project";
import { CopyMangerHelpers } from "./copy-manager-helpers.backend";
import { CopyManager } from "./copy-manager.backend";

@CLASS.NAME('CopyManagerOrganization')
export class CopyManagerOrganization extends CopyManager {

  //#region target project
  get targetProjNameForOrgBuild() {
    const target = _.first((this.args || '').split(' ')).replace('/', '')
    return target;
  }
  //#endregion

  //#region init
  public init(
    buildOptions: BuildOptions,
    renameDestinationFolder?: string,
  ) {
    super.init(buildOptions, renameDestinationFolder);
    const monitoredOutDir = this.monitoredOutDir;

    this.initOptions({
      folderPath: [
        monitoredOutDir,
      ],
      folderPathContentCheck: [
        monitoredOutDir
      ]
    })

  }
  //#endregion

  //#region local temp proj path
  get localTempProjPath() {
    const targetProjPath = path.join(
      this.project.location,
      this.outDir,
      this.project.name,
      this.targetProjNameForOrgBuild,
      this.tempProjName,
    );
    return crossPlatformPath(targetProjPath)
  }
  //#endregion

  //#region root package name
  get rootPackageName() {
    const rootPackageName = ((
      _.isString(this.renameDestinationFolder) && this.renameDestinationFolder !== '')
      ? this.renameDestinationFolder
      : `@${this.project.name}`
    );
    return rootPackageName
  }
  //#endregion

  //#region monitored out dir
  get monitoredOutDir(): string {
    const monitorDir: string = crossPlatformPath(path.join(
      this.project.location,
      this.outDir,
      this.project.name,
      this.targetProjNameForOrgBuild,
      this.outDir,
      'libs',
    ));
    return monitorDir;
  }
  //#endregion

  //#region get chhildren
  getChildren(): Project[] {
    return [
      this.project.children.find(c => c.name === this.targetProjNameForOrgBuild),
      ...this.project.children.filter(c => c.name !== this.targetProjNameForOrgBuild),
    ];
  }
  //#endregion

  // //#region get source folder
  // getSourceFolder(
  //   monitorDir: string,
  //   currentBrowserFolder: Models.dev.BuildDirBrowser,
  //   isTempLocalProj: boolean
  // ) {
  //   const sourceBrowser = crossPlatformPath(isTempLocalProj ?
  //     path.join(
  //       path.dirname(monitorDir),
  //       currentBrowserFolder,
  //     ) : path.join(
  //       this.localTempProjPath,
  //       config.folder.node_modules,
  //       this.rootPackageName,
  //       currentBrowserFolder,
  //     ));
  //   return sourceBrowser;
  // };
  // //#endregion

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

      Helpers.remove(destPackageInNodeModulesBrowser);

      for (let index = 0; index < this.children.length; index++) {
        const c = this.children[index];
        const childDestPackageInNodeModules = path.join(
          destPackageInNodeModules,
          CopyMangerHelpers.childPureName(c)
        );

        const childDestPackageInNodeModulesBrowser = path.join(
          destPackageInNodeModules,
          CopyMangerHelpers.childPureName(c),
          currentBrowserFolder,
        );

        if (Helpers.isSymlinkFileExitedOrUnexisted(childDestPackageInNodeModules)) {
          Helpers.removeFileIfExists(childDestPackageInNodeModules);
        }
        if (!Helpers.exists(childDestPackageInNodeModules)) {
          Helpers.mkdirp(childDestPackageInNodeModules);
        }
        if (Helpers.isSymlinkFileExitedOrUnexisted(childDestPackageInNodeModulesBrowser)) {
          Helpers.removeFileIfExists(childDestPackageInNodeModulesBrowser);
        }
        if (!Helpers.exists(childDestPackageInNodeModulesBrowser)) {
          Helpers.mkdirp(childDestPackageInNodeModulesBrowser);
        }
      }

    }
  }
  //#endregion

  //#region transform map files
  changedJsMapFilesInternalPathesForDebug(
    content: string,
    isBrowser: boolean,
    isForCliDebuggerToWork?: boolean,
  ): string {

    let toReplaceString2 = isBrowser
      ? `../tmp-libs-for-${this.outDir}/${this.project.name}/projects/${this.project.name}/${config.folder.src}`
      : `../../../tmp-source-${this.outDir}`;

    let toReplaceString1 = `"${toReplaceString2}`;
    const addon = `/libs/(${this.children.map(c => {
      return Helpers.escapeStringForRegEx(CopyMangerHelpers.childPureName(c));
    }).join('|')})`;

    const regex1 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString1) + addon, 'g');
    const regex2 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString2) + addon, 'g');

    if (isBrowser) { // TODO replace browser doesnt make sense ?? - for now yes
      // content = content.replace(regex1, `"./${config.folder.src}`);
      // content = content.replace(regex2, config.folder.src);
    } else {
      content = content.replace(regex1, `"./${config.folder.src}`);
      content = content.replace(regex2, config.folder.src);
    }

    return content;
  }
  //#endregion

  //#region copy compiled sources and declarations

  copyCompiledSourcesAndDeclarations(destination: Project, isTempLocalProj: boolean) {
    // @LAST TODO
    // for (let index = 0; index < this.children.length; index++) {
    //   const c = this.children[index];
    //   const childName = CopyMangerHelpers.childPureName(c);
    //   const sourceToLink = crossPlatformPath(path.join(c.location, config.folder.src));
    //   const destPackageLinkSourceLocation = crossPlatformPath(path.join(
    //     destination.location,
    //     config.folder.node_modules,
    //     this.rootPackageName,
    //     childName,
    //     config.folder.src,
    //   ));

    //   // const res = action(
    //   //   sourceToLink,
    //   //   destPackageLinkSourceLocation,
    //   //   this.project
    //   // );
    //   if ((mode === 'check-dest-packge-source-link-ok') && !res) {
    //     return false;
    //   }
    // }

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
    // @LAST TODO
    // for (let index = 0; index < this.children.length; index++) {
    //   const c = this.children[index];
    //   const childName = CopyMangerHelpers.childPureName(c);
    //   const sourceToLink = crossPlatformPath(path.join(c.location, config.folder.src));
    //   const destPackageLinkSourceLocation = crossPlatformPath(path.join(
    //     destination.location,
    //     config.folder.node_modules,
    //     this.rootPackageName,
    //     childName,
    //     config.folder.src,
    //   ));

    //   // const res = action(
    //   //   sourceToLink,
    //   //   destPackageLinkSourceLocation,
    //   //   this.project
    //   // );
    //   if ((mode === 'check-dest-packge-source-link-ok') && !res) {
    //     return false;
    //   }
    // }

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
        let orgContent = Helpers.readFile(absBrowserJsMapFilePath);

        // overriting original file
        Helpers.writeFile(
          absBrowserJsMapFilePath,
          this.changedJsMapFilesInternalPathesForDebug(orgContent, true)
        );

        const monitoredOutDirFileToReplaceBack = path.join(
          this.monitoredOutDir,
          crossPlatformPath(absBrowserJsMapFilePath).replace(destinationPackageLocation, ''),
        );

        //
        Helpers.writeFile(
          monitoredOutDirFileToReplaceBack,
          this.changedJsMapFilesInternalPathesForDebug(orgContent, true, true),
        );

      });
    }
    //#endregion

    //#region fixing (dist|bundle)/**.js.map* files
    const mapBackendFilesPattern = `${destinationPackageLocation}/**/*.js.map`;
    const mpaBackendFiles = glob.sync(mapBackendFilesPattern,
      { ignore: [`${config.folder.browser}/**/*.*`, `${config.folder.websql}/**/*.*`] })


    mpaBackendFiles.forEach(absBackendMapFilePath => {
      let orgContent = Helpers.readFile(absBackendMapFilePath);
      Helpers.writeFile(absBackendMapFilePath, this.changedJsMapFilesInternalPathesForDebug(orgContent, false));


      const monitoredOutDirFileToReplaceBack = path.join(
        this.monitoredOutDir,
        crossPlatformPath(absBackendMapFilePath).replace(destinationPackageLocation, ''),
      );

      Helpers.writeFile(
        monitoredOutDirFileToReplaceBack,
        this.changedJsMapFilesInternalPathesForDebug(orgContent, false, true)
      );

    });
    //#endregion
    Helpers.log('fixing maps done...')
  }
  //#endregion

  //#region copy backend and browser jsM (m)js.map files to destination location
  copyBackendAndBrowserJsMapFilesFromLocalProjTo(destination: Project) {
    // @LAST TODO
    // for (let index = 0; index < this.children.length; index++) {
    //   const c = this.children[index];
    //   const childName = CopyMangerHelpers.childPureName(c);
    //   const sourceToLink = crossPlatformPath(path.join(c.location, config.folder.src));
    //   const destPackageLinkSourceLocation = crossPlatformPath(path.join(
    //     destination.location,
    //     config.folder.node_modules,
    //     this.rootPackageName,
    //     childName,
    //     config.folder.src,
    //   ));

    //   // const res = action(
    //   //   sourceToLink,
    //   //   destPackageLinkSourceLocation,
    //   //   this.project
    //   // );
    //   if ((mode === 'check-dest-packge-source-link-ok') && !res) {
    //     return false;
    //   }
    // }

    const destinationPackageLocation = this.localTempProj.node_modules.pathFor(this.rootPackageName);

    const allMjsBrowserFiles = CopyMangerHelpers.browserwebsqlFolders.map(currentBrowserFolder => {
      const mjsBrowserFilesPattern = `${destinationPackageLocation}/`
        + `${currentBrowserFolder}`
        + `/**/*.mjs.map`;

      const mjsBrwoserFiles = glob.sync(mjsBrowserFilesPattern);
      return mjsBrwoserFiles;
    }).reduce((a, b) => a.concat(b), [])

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

    // @LAST TODO
    // for (let index = 0; index < this.children.length; index++) {
    //   const c = this.children[index];
    //   const childName = CopyMangerHelpers.childPureName(c);
    //   const sourceToLink = crossPlatformPath(path.join(c.location, config.folder.src));
    //   const destPackageLinkSourceLocation = crossPlatformPath(path.join(
    //     destination.location,
    //     config.folder.node_modules,
    //     this.rootPackageName,
    //     childName,
    //     config.folder.src,
    //   ));

    //   // const res = action(
    //   //   sourceToLink,
    //   //   destPackageLinkSourceLocation,
    //   //   this.project
    //   // );
    //   if ((mode === 'check-dest-packge-source-link-ok') && !res) {
    //     return false;
    //   }
    // }

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
      this.localTempProj.node_modules.pathFor(this.rootPackageName),
      specyficFileRelativePath
    ));

    if (!isTempLocalProj) {
      // Helpers.log(`Eqal content with temp proj: ${}`)
      Helpers.copyFile(sourceFileInLocalTempFolder, destinationFile);
      return;
    }

    const sourceFile = crossPlatformPath(path.normalize(path.join(
      this.monitoredOutDir,
      specyficFileRelativePath
    )));

    let contentToWriteInDestination = (Helpers.readFile(sourceFile));

    contentToWriteInDestination = contentToWriteInDestination ? contentToWriteInDestination : '';

    if (path.basename(sourceFile).endsWith('.d.ts')) {
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

    if (this.watch || isTempLocalProj) {
      const isBackendMapsFile = destinationFile.endsWith('.js.map');
      const isBrowserMapsFile = destinationFile.endsWith('.mjs.map');

      if (isBackendMapsFile || isBrowserMapsFile) {
        if (isBackendMapsFile) {
          contentToWriteInDestination = this.changedJsMapFilesInternalPathesForDebug(
            contentToWriteInDestination, false
          );

          if (isTempLocalProj) {
            const monitoredOutDirFileToReplaceBack = crossPlatformPath(path.join(
              this.monitoredOutDir,
              crossPlatformPath(sourceFile).replace(this.monitoredOutDir, ''),
            ));


            Helpers.writeFile(monitoredOutDirFileToReplaceBack, this.changedJsMapFilesInternalPathesForDebug(
              contentToWriteInDestination, false, true
            ));
          }

        }
        if (isBrowserMapsFile) {
          contentToWriteInDestination = this.changedJsMapFilesInternalPathesForDebug(
            contentToWriteInDestination, true
          );

          if (isTempLocalProj) {
            const monitoredOutDirFileToReplaceBack = crossPlatformPath(path.join(
              this.monitoredOutDir,
              crossPlatformPath(sourceFile).replace(this.monitoredOutDir, ''),
            ));

            Helpers.writeFile(monitoredOutDirFileToReplaceBack, this.changedJsMapFilesInternalPathesForDebug(
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
