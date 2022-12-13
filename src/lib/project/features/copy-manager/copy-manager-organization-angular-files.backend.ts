import { config } from "tnp-config";
import { crossPlatformPath, path, _ } from "tnp-core";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import { Project } from "../../abstract/project/project";
import { BundleMjsFesmModuleSpliter } from "./bundle-mjs-fesm-module-spliter.backend";
import { CopyMangerHelpers } from "./copy-manager-helpers.backend";
import type { CopyManagerOrganization } from "./copy-manager-organization.backend";


export class CopyMangerOrganizationAngularFiles {

  //#region  getters
  get targetProj() {
    return this.manager.targetProj;
  }

  get targetProjName() {
    return this.manager.targetProjName;
  }

  get localTempProj() {
    return this.manager.localTempProj;
  }
  get monitoredOutDir() {
    return this.manager.monitoredOutDir;
  }

  get rootPackageName() {
    return this.manager.rootPackageName;
  }

  get outDir() {
    return this.manager.outDir;
  }

  get children() {
    return this.manager.getChildren();
  }
  //#endregion

  //#region constructor
  constructor(private manager: CopyManagerOrganization) { }
  //#endregion

  //#region api

  //#region api / handle single file
  /**
  *
  * For handling files:
  *
  *  "websql/esm2020/lib/index.mjs"
  *  "browser/esm2020/lib/index.mjs"
  *  "browser/fesm2020/<targetProjName>.mjs.map"
  *  "browser/fesm2020/<targetProjName>.mjs"
  *  "websql/fesm2020/<targetProjName>.mjs.map"
  *  "websql/fesm2020/<targetProjName>.mjs"
  *  "websql/fesm2015/<targetProjName>.mjs.map"
  *  "websql/fesm2015/<targetProjName>.mjs"
  *  "browser/fesm2015/<targetProjName>.mjs.map"
  *  "browser/fesm2015/<targetProjName>.mjs"
  *  "websql/package.json"
  *  "browser/package.json"
  *
  * This function populatest modules children
  *
  */
  handleCopyOfSingleFile(
    specyficFileRelativePath: string,
    destination: Project,
    isTempLocalProj: boolean,
    wasRecrusive: boolean,
  ): void {

    const currentBrowserFolder = _.first(
      specyficFileRelativePath.split('/')
    ) as Models.dev.BuildDirBrowser;

    const angularCompilationFolder = _.first(
      specyficFileRelativePath.split('/').slice(1)
    ) as keyof typeof CopyMangerHelpers.angularBrowserComiplationFolders;

    if (CopyMangerHelpers.angularBrowserComiplationFoldersArr.includes(angularCompilationFolder)) {
      this.actionForFolder(
        destination,
        isTempLocalProj,
        currentBrowserFolder,
        angularCompilationFolder,
        {
          specyficFileRelativePathForBrowserModule: specyficFileRelativePath.split('/').slice(2).join('/')
        }
      );
    } else {
      // TODO
      // copyt file ?? or fix package json ?
    }
  }
  //#endregion

  //#region api / action for folder
  actionForFolder(
    destinationOrLocalTempProj: Project,
    isTempLocalProj: boolean,
    currentBrowserFolder: Models.dev.BuildDirBrowser,
    angularCompilationFolder: keyof typeof CopyMangerHelpers.angularBrowserComiplationFolders,
    options?: {
      specyficFileRelativePathForBrowserModule?: string,
    }
  ) {
    const { specyficFileRelativePathForBrowserModule } = options || {
      specyficFileRelativePathForBrowserModule: void 0 as string
    };

    const isEsm2020 = (angularCompilationFolder === CopyMangerHelpers.angularBrowserComiplationFolders.esm2020);

    const children = this.children;
    for (let index = 0; index < children.length; index++) {
      const child = children[index];

      // ex: @codete-ngrx-blog-post/main/(browser|websql)
      const rootPackageNameForChildBrowser = this.manager
        .rootPackageNameForChildBrowser(child, currentBrowserFolder);

      const childBrowserOrWebsqlDestAbsPath = path.join(
        destinationOrLocalTempProj.node_modules.pathFor(rootPackageNameForChildBrowser),
        angularCompilationFolder
      );

      const path_InMonitoredLocation = crossPlatformPath(path.join(
        this.monitoredOutDir,
        currentBrowserFolder,
        angularCompilationFolder
      ));

      const path_InLocalTempProj = crossPlatformPath(path.join(
        this.localTempProj.node_modules.pathFor(rootPackageNameForChildBrowser),
        angularCompilationFolder,
      ));

      const sourceBrowserOrWerbsqlFolderAbsPath = isTempLocalProj ? path_InMonitoredLocation : path_InLocalTempProj;

      Helpers.remove(childBrowserOrWebsqlDestAbsPath); // TODO This may be expensive
      Helpers.copy(sourceBrowserOrWerbsqlFolderAbsPath, childBrowserOrWebsqlDestAbsPath, {
        copySymlinksAsFiles: false,
      });

      this.fixBrowserFolderMjsFilesInLocalTempProj(
        isTempLocalProj,
        sourceBrowserOrWerbsqlFolderAbsPath,
        child,
        angularCompilationFolder,
        currentBrowserFolder,
        destinationOrLocalTempProj,
        {
          isMap: false,
          useModuleSpliter: !isEsm2020,// esm has embeded maps
        }
      );
      if (isEsm2020) {
        this.fixNotNeededFilesInESMforChildLocalTempProj(
          isTempLocalProj,
          child,
          angularCompilationFolder,
          currentBrowserFolder,
          destinationOrLocalTempProj,
        );
      } else {
        this.fixBrowserFolderMjsFilesInLocalTempProj(
          isTempLocalProj,
          sourceBrowserOrWerbsqlFolderAbsPath,
          child,
          angularCompilationFolder,
          currentBrowserFolder,
          destinationOrLocalTempProj,
          {
            isMap: true,
            useModuleSpliter: false,
          }
        );
      }

    }

  }
  //#endregion

  //#region api / copy browser folders

  //#endregion

  //#region api / fix angular package.json
  fixPackageJson(child: Project, destination: Project, currentBrowserFolder?: Models.dev.BuildDirBrowser) {
    const childPackageName = path.join(this.rootPackageName, child.name);

    if (currentBrowserFolder) {
      const rootPackageNameForChildBrowser = path.join(childPackageName, currentBrowserFolder);
      const location = destination.node_modules.pathFor(rootPackageNameForChildBrowser);
      const childName = child.name;
      const pj = {
        "name": rootPackageNameForChildBrowser,
        "version": "0.0.0",
        "module": `fesm2015/${childName}.mjs`,
        "es2020": `fesm2020/${childName}.mjs`,
        "esm2020": `esm2020/${childName}.mjs`,
        "fesm2020": `fesm2020/${childName}.mjs`,
        "fesm2015": `fesm2015/${childName}.mjs`,
        "typings": `${childName}.d.ts`,
        "exports": {
          "./package.json": {
            "default": "./package.json"
          },
          ".": {
            "types": `./${childName}.d.ts`,
            "esm2020": `./esm2020/${childName}.mjs`,
            "es2020": `./fesm2020/${childName}.mjs`,
            "es2015": `./fesm2015/${childName}.mjs`,
            "node": `./fesm2015/${childName}.mjs`,
            "default": `./fesm2020/${childName}.mjs`
          }
        },
        "sideEffects": false
      };
      Helpers.writeJson([location, config.file.package_json], pj);
    } else {
      const location = destination.node_modules.pathFor(childPackageName);
      // const childName = child.name;
      const pj = {
        "name": childPackageName,
        "version": "0.0.0",
      };
      // const exportsKey = 'exports';
      // pj[exportsKey] = {};
      for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {
        const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
        pj[`.${currentBrowserFolder}`] = `./${currentBrowserFolder}`;
        // pj[`${exportsKey}${currentBrowserFolder}`] =
      }
      Helpers.writeJson([location, config.file.package_json], pj);
    }
  }
  //#endregion

  //#region api / fix build releate files
  fixBuildRelatedFiles(child: Project, destination: Project, currentBrowserFolder: Models.dev.BuildDirBrowser) {

    const childPackageName = path.join(this.rootPackageName, child.name);
    const rootPackageNameForChildBrowser = path.join(childPackageName, currentBrowserFolder);
    const location = destination.node_modules.pathFor(rootPackageNameForChildBrowser);

    //#region <child-name>.d.ts
    Helpers.writeFile([location, `${child.name}.d.ts`], `
/**
 * Generated bundle index. Do not edit.
 */
/// <amd-module name="main" />
export * from './${config.file.public_api}';
    `.trimLeft());
    //#endregion

    //#region public api.ts
    Helpers.writeFile([location, config.file.public_api_d_ts], `
     /**
      * Generated bundle index. Do not edit.
      */
     /// <amd-module name="main" />
     export * from './${config.file.index}';
         `.trimLeft());
    //#endregion

  }
  //#endregion

  //#endregion

  //#region private metods

  //#region private metods / fix not needed files in esm 2020 (ONLY when tmp-local-proj)
  /**
   * only for tmp-local-proj as destination
   */
  private fixNotNeededFilesInESMforChildLocalTempProj(
    isTempLocalProj: boolean,
    child: Project,
    angularCompilationFolder: keyof typeof CopyMangerHelpers.angularBrowserComiplationFolders,
    currentBrowserFolder: Models.dev.BuildDirBrowser,
    destinationTempProj: Project,
  ) {

    // ex:  '@angular/core/(browser|websql)'
    const rootPackageNameForChildBrowser = this.manager
      .rootPackageNameForChildBrowser(child, currentBrowserFolder);

    const destinationPathMjs_publcApi = crossPlatformPath(path.join(
      destinationTempProj.node_modules.pathFor(rootPackageNameForChildBrowser),
      angularCompilationFolder,
      'public-api.mjs'
    ));

    const destinationPathLibsFolder = crossPlatformPath(path.join(
      destinationTempProj.node_modules.pathFor(rootPackageNameForChildBrowser),
      angularCompilationFolder,
      config.folder.libs
    ));

    if (child.name === this.targetProjName) {
      Helpers.removeFolderIfExists(destinationPathLibsFolder);
      Helpers.writeFile(destinationPathMjs_publcApi, `export * from './lib';\n`);
    } else {
      Helpers.writeFile(destinationPathMjs_publcApi, `export * from './libs/${child.name}';\n`);

      Helpers.foldersFrom(destinationPathLibsFolder)
        .filter(f => path.basename(f) !== child.name)
        .forEach(f => Helpers.remove(f, true));

      Helpers.removeFolderIfExists(crossPlatformPath(path.join(
        destinationTempProj.node_modules.pathFor(rootPackageNameForChildBrowser),
        angularCompilationFolder,
        config.folder.lib,
      )))
    }

  };
  //#endregion

  //#region private metods / fix for module files in fesm2015 or fesm2022 (ONLY when tmp-local-proj)
  /**
   * only for tmp-local-proj as destination
   *
   * for each (f)esm(2015|2022) there is <targetname.mjs> file
   * that needs to be copy to proper module (with maps)
   */
  private fixBrowserFolderMjsFilesInLocalTempProj(
    isTempLocalProj: boolean,
    sourceBrowserOrWerbsqlFolderAbsPath: string,
    child: Project,
    angularCompilationFolder: keyof typeof CopyMangerHelpers.angularBrowserComiplationFolders,
    currentBrowserFolder: Models.dev.BuildDirBrowser,
    destinationTempProj: Project,
    options: {
      isMap: boolean,
      useModuleSpliter: boolean,
    }
  ) {
    const { isMap, useModuleSpliter } = options;

    // ex:  '@angular/core/(browser|websql)'
    const rootPackageNameForChildBrowser = this.manager
      .rootPackageNameForChildBrowser(child, currentBrowserFolder);

    const sourceMjsFile = path.join(
      sourceBrowserOrWerbsqlFolderAbsPath,
      `${this.targetProjName}.mjs${isMap ? '.map' : ''}`,
    );

    const destinationLocationMjsFileDest = path.join(
      destinationTempProj.node_modules.pathFor(rootPackageNameForChildBrowser),
      angularCompilationFolder,
      `${child.name}.mjs${isMap ? '.map' : ''}`,
    );


    Helpers.copyFile(sourceMjsFile, destinationLocationMjsFileDest);


    if (!isTempLocalProj && (child.name !== this.targetProjName)) {
      const destinationLocationMjsFileDestTargeFileToRemove = path.join(
        destinationTempProj.node_modules.pathFor(rootPackageNameForChildBrowser),
        angularCompilationFolder,
        `${this.targetProjName}.mjs${isMap ? '.map' : ''}`,
      );
      Helpers.removeFileIfExists(destinationLocationMjsFileDestTargeFileToRemove);
    }

    if (useModuleSpliter && !isMap) {
      BundleMjsFesmModuleSpliter.fixForTarget(
        child,
        destinationLocationMjsFileDest,
      );
    }

    // if (child.name !== this.targetProjName) {
    //   const destinationLocationMjsFileDestToRemove = path.join(
    //     destinationTempProj.node_modules.pathFor(rootPackageNameForChildBrowser),
    //     angularCompilationFolder,
    //     `${this.targetProjName}.mjs${isMap ? '.map' : ''}`,
    //   );
    //   Helpers.removeIfExists(destinationLocationMjsFileDestToRemove);
    // }

  };
  //#endregion

  //#endregion
}

