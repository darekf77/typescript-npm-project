import { IncCompiler } from "incremental-compiler";
import { config } from "tnp-config";
import { crossPlatformPath, path } from "tnp-core";
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

  //#region  inital fix for destination
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
    Helpers.writeFile(this.localTempProjectPathes.packageJson, {
      name: path.basename(this.localTempProjPath),
      version: '0.0.0'
    });
    Helpers.mkdirp(this.localTempProjectPathes.nodeModules);
  }
  //#endregion

  //#region local temp proj path
  get localTempProjPath() { return ''; }
  //#endregion

  //#region initial fix for destination pacakge
  initalFixForDestinationPackage(destination: Project): void { }
  //#endregion

  //#region transform map files
  transformMapFile(
    content: string,
    isBrowser: boolean,
    isForCliDebuggerToWork?: boolean,
  ): string { return ''; }
  //#endregion

  //#region copy compiled sources and declarations
  copyCompiledSourcesAndDeclarations(destination: Project, isTempLocalProj: boolean) { }
  //#endregion

  //#region copy source maps
  copySourceMaps(destination: Project, isTempLocalProj: boolean) { }
  //#endregion

  //#region handle single file
  handleCopyOfSingleFile(destination: Project, isTempLocalProj: boolean, specyficFileRelativePath: string): void { }
  //#endregion

  //#region handle all files actions

  //#region get children
  getChildren(): Project[] {
    return [];
  }
  //#endregion

  //#region get source folder
  abstract getSourceFolder(
    monitorDir: string,
    currentBrowserFolder: Models.dev.BuildDirBrowser,
    isTempLocalProj: boolean
  ): string;
  //#endregion


}
