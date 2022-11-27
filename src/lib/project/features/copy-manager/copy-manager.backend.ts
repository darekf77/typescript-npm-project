import { IncCompiler } from "incremental-compiler";
import { config } from "tnp-config";
import { crossPlatformPath, glob, path } from "tnp-core";
import { BuildOptions } from "tnp-db";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import { CLASS } from "typescript-class-helpers";
import { Project } from "../../abstract/project/project";
import { BaseCopyManger } from "./base-copy-manager.backend";
import { CopyMangerHelpers } from "./copy-manager-helpers.backend";
import type { CopyManagerOrganization } from "./copy-manager-organization.backend";
import type { CopyManagerStandalone } from "./copy-manager-standalone.backend";

@CLASS.NAME('CopyManager')
export abstract class CopyManager extends BaseCopyManger {

  static for(project: Project): CopyManager {
    if (project.isSmartContainer) {
      const CopyManagerOrganizationClass = CLASS.getBy('CopyManagerOrganization') as typeof CopyManagerOrganization;
      return new CopyManagerOrganizationClass(project);
    } else {
      const CopyManagerStandaloneClass = CLASS.getBy('CopyManagerStandalone') as typeof CopyManagerStandalone;
      return new CopyManagerStandaloneClass(project);
    }
  }

  //#region root package name
  get rootPackageName(): string { return '' }
  //#endregion

  //#region monitored out dir
  get monitoredOutDir(): string { return '' }
  //#endregion

  //#region inital fix for destination
  initalFixForDestination(destination: Project): void { }
  //#endregion

  //#region init
  public init(
    buildOptions: BuildOptions,
    renameDestinationFolder?: string,
  ) {
    // @ts-ignore
    this.renameDestinationFolder = renameDestinationFolder;

    // @ts-ignore
    this.outDir = buildOptions.outDir;
    // @ts-ignore
    this.copyto = buildOptions.copyto;
    // @ts-ignore
    this.args = buildOptions.args;
    // @ts-ignore
    this.watch = !!buildOptions.watch;

    if (!Array.isArray(this.copyto)) {
      // @ts-ignore
      this.copyto = [];
    }

    if (this.copyto.length === 0) {
      Helpers.log(`No need to --copyto on build finsh...(only copy to local temp proj) `);
    }

    // @ts-ignore
    this.projectChildren = this.project.children;

    // @ts-ignore
    this._isomorphicPackages = this.project.availableIsomorphicPackagesInNodeModules;
    Helpers.log(`Opearating on ${this.isomorphicPackages.length} isomorphic pacakges...`);

    Helpers.remove(this.localTempProjPath);
    Helpers.writeFile([this.localTempProjPath, config.file.package_json], {
      name: path.basename(this.localTempProjPath),
      version: '0.0.0'
    });
    Helpers.mkdirp([this.localTempProjPath, config.folder.node_modules]);
  }
  //#endregion

  //#region local temp proj path
  get localTempProjPath() { return ''; }
  //#endregion

  //#region initial fix for destination pacakge
  initalFixForDestinationPackage(destination: Project): void { }
  //#endregion

  //#region transform map files
  changedJsMapFilesInternalPathesForDebug(
    content: string,
    isBrowser: boolean,
    isForCliDebuggerToWork?: boolean,
  ): string { return ''; }
  //#endregion

  //#region fix d.ts import files in folder
  /**
   *  fixing d.ts for (dist|bundle)/(browser|websql) when destination local project
   * @param distOrBuneleOrPkgFolder usually dist
   * @param isTempLocalProj
   */
  protected fixingDtsImports(distOrBuneleOrPkgFolder: string) {

    for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {

      const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
      Helpers.log('Fixing .d.ts. files start...');
      const sourceBrowser = path.join(distOrBuneleOrPkgFolder, currentBrowserFolder);
      const browserDtsFiles = Helpers.filesFrom(sourceBrowser, true)
        .filter(f => f.endsWith('.d.ts'));

      for (let index = 0; index < browserDtsFiles.length; index++) {
        const dtsFileAbsolutePath = browserDtsFiles[index];
        const dtsFileContent = Helpers.readFile(dtsFileAbsolutePath);
        const dtsFixedContent = CopyMangerHelpers.fixDtsImport(
          dtsFileContent,
          // dtsFileAbsolutePath,
          currentBrowserFolder,
          this.isomorphicPackages
        );
        if (dtsFileAbsolutePath.trim() !== dtsFileContent.trim()) {
          Helpers.writeFile(dtsFileAbsolutePath, dtsFixedContent);
        }
      }
      Helpers.log('Fixing .d.ts. files done.');
    }
  }
  //#endregion

  //#region fix backend and browser js map files
  /**
  *  fix backend and browser js (m)js.map files (for proper debugging)
  * destination package here is temp project
  *
  * Fix for 2 things:
  * - debugging when in cli mode (fix in actual (dist|bundle)/(browser/websql)  )
  * - debugging when in node_modules of other project (fixing only tmp-local-project)
  * @param destinationPackageLocation desitnation/node_modues/< rootPackageName >
  */
  protected abstract fixBackendAndBrowserJsMapFilesIn(): void;
  //#endregion

  //#region write fixed map files
  protected writeFixedMapFile(
    isForBrowser: boolean,
    specyficFileRelativePath: string,
    destinationPackageLocation: string,
    content?: string
  ) {

    const absMapFilePathInLocalProjNodeModulesPackage = crossPlatformPath(path.join(
      destinationPackageLocation,
      specyficFileRelativePath,
    ));

    let orgContent = content ? content : Helpers.readFile(absMapFilePathInLocalProjNodeModulesPackage);

    const fixedContentNonCLI = this.changedJsMapFilesInternalPathesForDebug(orgContent, isForBrowser);
    Helpers.writeFile(
      absMapFilePathInLocalProjNodeModulesPackage,
      fixedContentNonCLI,
    );

    const monitoredOutDirFileToReplaceBack = path.join(
      this.monitoredOutDir,
      specyficFileRelativePath,
    );

    const fixedContentCLIDebug = this.changedJsMapFilesInternalPathesForDebug(orgContent, isForBrowser, true)
    Helpers.writeFile(
      monitoredOutDirFileToReplaceBack,
      fixedContentCLIDebug,
    );
  }
  //#endregion

  //#region copy backend and browser js map files
  /**
   * Copy fixed maps from tmp-local-project to other projects
   *
   * @param destination any project other than tmp-local-proj
   */
  protected abstract copyBackendAndBrowserJsMapFilesFromLocalProjTo(destination: Project);
  //#endregion

  //#region copy compiled sources and declarations
  copyCompiledSourcesAndDeclarations(destination: Project, isTempLocalProj: boolean) { }
  //#endregion

  //#region copy source maps
  /**
   *
   * @param destination that already has node_modues/rootPackagename copied
   * @param isTempLocalProj
   */
  copySourceMaps(destination: Project, isTempLocalProj: boolean) {
    if (isTempLocalProj) { // destination === tmp-local-proj
      this.fixBackendAndBrowserJsMapFilesIn();
    } else {
      this.copyBackendAndBrowserJsMapFilesFromLocalProjTo(destination);
    }
  }
  //#endregion

  //#region handle single file
  handleCopyOfSingleFile(destination: Project, isTempLocalProj: boolean, specyficFileRelativePath: string): void { }
  //#endregion

  //#region get children
  getChildren(): Project[] {
    return [];
  }
  //#endregion

}
