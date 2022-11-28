import { config } from "tnp-config";
import { crossPlatformPath, glob, path, _ } from "tnp-core";
import { BuildOptions } from "tnp-db";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import { CLASS } from "typescript-class-helpers";
import { Project } from "../../abstract/project/project";
import { CopyMangerHelpers } from "./copy-manager-helpers.backend";
import { CopyManagerStandalone } from "./copy-manager-standalone.backend";

@CLASS.NAME('CopyManagerOrganization')
export class CopyManagerOrganization extends CopyManagerStandalone {
  protected readonly children: Project[];

  protected readonly angularBrowserComiplationFolders = {
    esm2020: 'esm2020',
    fesm2015: 'fesm2015',
    fesm2020: 'fesm2020',
  };
  protected readonly angularBrowserComiplationFoldersArr = Object.values(this.angularBrowserComiplationFolders);

  //#region target project name
  /**
   * target name for organizaiton (smart container) build
   */
  get targetProjName() {
    const target = _.first((this.args || '').split(' ')).replace('/', '')
    return target;
  }
  //#endregion

  //#region target project path
  get targetProjPath() {
    return crossPlatformPath(path.join(
      this.project.location,
      this.outDir,
      this.project.name,
      this.targetProjName,
    ));
  }
  //#endregion

  //#region target project
  get targetProj() {
    return Project.From(this.targetProjPath);
  }
  //#endregion

  //#region init
  init(
    buildOptions: BuildOptions,
    renameDestinationFolder?: string,
  ) {
    super.init(buildOptions, renameDestinationFolder);
    // @ts-ignore
    this.children = this.getChildren();
  }
  //#endregion

  //#region init watching
  public initWatching() {
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
    const targetProjPath = crossPlatformPath(path.join(
      this.targetProjPath,
      this.tempProjName,
    ));
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
      this.targetProjPath,
      this.outDir
    ));
    return monitorDir;
  }
  //#endregion

  //#region get chhildren
  getChildren(): Project[] {
    return [
      this.project.children.find(c => c.name === this.targetProjName),
      ...this.project.children.filter(c => c.name !== this.targetProjName),
    ];
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
    isForCliDebuggerToWork: boolean,
    filePath: string,
  ): string {
    // if (!content) { // additiaonal thing are added to (dist|bundle)
    //   debugger;     // QUICK FIX below =@LAST
    // }
    content = content ? content : '';

    let toReplaceString2 = isBrowser
      ? `../tmp-libs-for-${this.outDir}/${this.project.name}/projects/${this.project.name}/${config.folder.src}`
      : (`../../../tmp-source-${this.outDir}`);

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
      if (isForCliDebuggerToWork) {
        // @LAST THING TO DO:
        // 1. target/dist map files should be chaning correectlhy
        // 2. handle single files
        // 3. replace d.ts from no-cuts in normal dist or everywhere when copyto
        // 4. check if debugging is working
        // content = super.changedJsMapFilesInternalPathesForDebug(content, isBrowser, isForCliDebuggerToWork, filePath);
      } else {
        content = content.replace(regex1, `"./${config.folder.src}/lib`);
        content = content.replace(regex2, `${config.folder.src}/lib`);
      }
    }

    return content;
  }
  //#endregion

  //#region fix angular package browser files
  fixAngularPackageBrowserFiles(child: Project, destination: Project, currentBrowserFolder: Models.dev.BuildDirBrowser) {

    const childPackageName = path.join(this.rootPackageName, child.name);
    const rootPackageNameForChildBrowser = path.join(childPackageName, currentBrowserFolder);
    const location = destination.node_modules.pathFor(rootPackageNameForChildBrowser)

    //#region package.json
    const childName = child.name;
    const pj = {
      "name": childPackageName,
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
    //#endregion

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

  //#region write specyfic for child dts files
  /**
   * final copy from dist|bundle to node_moules/rootpackagename
   */
  writeSpecyficForChildDtsFiles(destination: Project, rootPackageNameForChildBrowser: string, monitorDirForModuleBrowser: string) {
    const pkgLocInDestNodeModulesForChildBrowser = destination.node_modules.pathFor(rootPackageNameForChildBrowser);
    const filter = Helpers.filterDontCopy(this.sourceFolders, monitorDirForModuleBrowser);
    this.removeSourceLinksFolders(pkgLocInDestNodeModulesForChildBrowser);
    Helpers.copy(monitorDirForModuleBrowser, pkgLocInDestNodeModulesForChildBrowser, {
      copySymlinksAsFiles: false,
      filter,
    });
  }
  //#endregion

  //#region child package name
  /**
   * example: '@angular/core'
   */
  childPackageName(child: Project) {
    return path.join(this.rootPackageName, child.name);
  }
  //#endregion

  //#region root pacakge name for child + browser
  /**
   * example: '@angular/core/(browser|websql)'
   */
  rootPackageNameForChildBrowser(child: Project, currentBrowserFolder: Models.dev.BuildDirBrowser) {
    return path.join(this.childPackageName(child), currentBrowserFolder);
  }
  //#endregion

  //#region fixes for dts child files
  fixesForChildDtsFile(
    destination: Project,
    isTempLocalProj: boolean,
    child: Project,
    currentBrowserFolder: Models.dev.BuildDirBrowser,
  ) {
    const rootPackageNameForChildBrowser = this.rootPackageNameForChildBrowser(child, currentBrowserFolder);

    const monitorDirForModuleBrowser = isTempLocalProj //
      ? path.join(this.monitoredOutDir, currentBrowserFolder, 'libs', child.name)
      : this.localTempProj.node_modules.pathFor(rootPackageNameForChildBrowser);

    if (isTempLocalProj) { // when destination === tmp-local-proj => fix d.ts imports in (dist|bundle)
      CopyMangerHelpers.fixingDtsImports(monitorDirForModuleBrowser, this.isomorphicPackages);
    }
    this.writeSpecyficForChildDtsFiles(destination, rootPackageNameForChildBrowser, monitorDirForModuleBrowser);
  }
  //#endregion

  //#region fixes for dts child files
  copyAngularBrowserFolders(
    destination: Project,
    isTempLocalProj: boolean,
    child: Project,
    currentBrowserFolder: Models.dev.BuildDirBrowser,
  ) {

    const rootPackageNameForChildBrowser = this.rootPackageNameForChildBrowser(child, currentBrowserFolder);
    this.angularBrowserComiplationFoldersArr.forEach(angularCompilationFolder => {

      const destinationLocation = path.join(
        destination.node_modules.pathFor(rootPackageNameForChildBrowser),
        angularCompilationFolder
      );

      const pathInMonitoredLocation = path.join(this.monitoredOutDir, currentBrowserFolder, angularCompilationFolder);
      const pathInLocalTempProj = path.join(
        this.localTempProj.node_modules.pathFor(rootPackageNameForChildBrowser),
        angularCompilationFolder,
      );

      const monitorDirForModuleBrowser = isTempLocalProj ? pathInMonitoredLocation : pathInLocalTempProj;

      const fixFile = (isMap: boolean = false) => {
        const destinationLocationMjsFile = path.join(
          destination.node_modules.pathFor(rootPackageNameForChildBrowser),
          angularCompilationFolder,
          `${this.targetProjName}.mjs${isMap ? '.map' : ''}`,
        );

        const destinationLocationMjsFileDest = path.join(
          destination.node_modules.pathFor(rootPackageNameForChildBrowser),
          angularCompilationFolder,
          `${child.name}.mjs${isMap ? '.map' : ''}`,
        );

        if ((destinationLocationMjsFile !== destinationLocationMjsFileDest)
          && Helpers.exists(destinationLocationMjsFile)) {
          Helpers.move(destinationLocationMjsFile, destinationLocationMjsFileDest);
        }
      };

      if (angularCompilationFolder === this.angularBrowserComiplationFolders.esm2020) {
        // TODO better way to extract data for child module from angular build
        Helpers.copy(monitorDirForModuleBrowser, destinationLocation, {
          copySymlinksAsFiles: false,
        });
        fixFile();
      }

      if (angularCompilationFolder === this.angularBrowserComiplationFolders.fesm2015) {
        // TODO better way to extract data for child module from angular build
        Helpers.copy(monitorDirForModuleBrowser, destinationLocation, {
          copySymlinksAsFiles: false,
        });
        fixFile();
        fixFile(true);
      }

      if (angularCompilationFolder === this.angularBrowserComiplationFolders.fesm2020) {
        // TODO better way to extract data for child module from angular build
        Helpers.copy(monitorDirForModuleBrowser, destinationLocation, {
          copySymlinksAsFiles: false,
        });
        fixFile();
        fixFile(true);
      }


    })

  }
  //#endregion

  //#region copy compiled source and declaration (browser)
  /**
   * Problem here: spliting es2022, esfm2015 to modules
   */
  copyCompiledSourcesAndDeclarationsBrowsersFolders(
    destination: Project,
    isTempLocalProj: boolean
  ) {
    for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {
      const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];

      for (let index = 0; index < this.children.length; index++) {
        //#region prepare variables
        const child = this.children[index];
        this.fixesForChildDtsFile(destination, isTempLocalProj, child, currentBrowserFolder);
        this.fixAngularPackageBrowserFiles(child, destination, currentBrowserFolder);
        this.copyAngularBrowserFolders(destination, isTempLocalProj, child, currentBrowserFolder);
        //#endregion
      }
    }
    console.log('done')
  }
  //#endregion

  //#region fix additonal files and folder
  fixAdditonalFilesAndFolders(destination: Project) {

    [
      'index.d.ts',
      'app.d.ts',
    ].forEach(specyficFileRelativePath => {
      CopyMangerHelpers.browserwebsqlFolders.forEach(currentBrowserFolder => {
        const dtsFileAbsolutePath = path.join(specyficFileRelativePath, this.monitoredOutDir);
        CopyMangerHelpers.writeFixedVersionOfDtsFile(
          dtsFileAbsolutePath,
          currentBrowserFolder,
          this.isomorphicPackages,
        );
      });
    });

    [
      'index.js.map',
      'app.js.map',
    ].forEach(specyficFileRelativePath => {
      const destinationPackageLocation = destination.node_modules.pathFor(this.rootPackageName);
      this.writeFixedMapFile(true, specyficFileRelativePath, destinationPackageLocation);
      // this.writeFixedMapFile(true, specyficFileRelativePath, destinationPackageLocation);
    });
  }
  //#endregion


  //#region copy compiled sources and declarations
  copyCompiledSourcesAndDeclarations(destination: Project, isTempLocalProj: boolean) {
    // @LAST
    // if (isTempLocalProj) {
    //   this.fixAdditonalFilesAndFolders(destination);
    // }

    for (let index = 0; index < this.children.length; index++) {
      const child = this.children[index];
      const rootPackageNameForChild = path.join(this.rootPackageName, child.name);
      const monitorDirForModule = isTempLocalProj //
        ? path.join(this.monitoredOutDir, 'libs', child.name)
        : this.localTempProj.node_modules.pathFor(rootPackageNameForChild);

      if (isTempLocalProj) { // when destination === tmp-local-proj => fix d.ts imports in (dist|bundle)
        CopyMangerHelpers.fixingDtsImports(monitorDirForModule, this.isomorphicPackages);
      }

      //#region final copy from dist|bundle to node_moules/rootpackagename
      const pkgLocInDestNodeModulesForChild = destination.node_modules.pathFor(rootPackageNameForChild);
      const filter = Helpers.filterDontCopy(this.sourceFolders, monitorDirForModule);
      this.removeSourceLinksFolders(pkgLocInDestNodeModulesForChild);
      Helpers.copy(monitorDirForModule, pkgLocInDestNodeModulesForChild, {
        copySymlinksAsFiles: false,
        filter,
      });


      if (this.watch) {
        this.replaceIndexDtsForEntryPorjIndex(pkgLocInDestNodeModulesForChild);
      }

      //#endregion

    }
    this.copyCompiledSourcesAndDeclarationsBrowsersFolders(destination, isTempLocalProj);

    this.replaceIndexDtsFilesRootLevel(destination);
  }
  //#endregion

  //#region replace d.ts files in destination after copy
  replaceIndexDtsFilesRootLevel(destination: Project) {
    Helpers.writeFile(path.join(destination.location,
      config.folder.node_modules,
      this.rootPackageName,
      config.file.index_d_ts,
    ),
      `// Plase use: import { < anything > } from '@${this.project.name}/<${this.children.map(c => c.name).join('|')}>';\n`
    );
  }
  //#endregion

  //#region source for child
  sourcePathToLinkFor(child: Project) {
    const sourceToLink = crossPlatformPath(path.join(this.project.location, child.name, config.folder.src));
    return sourceToLink;
  }
  //#endregion

  //#region destination packge link source (usuall 'src' folder) location
  destPackageLinkSourceLocation(destination: Project, child: Project, currentBrowserFolder?: Models.dev.BuildDirBrowser) {
    const destPackageLinkSourceLocation = currentBrowserFolder ? crossPlatformPath(path.join(
      destination.node_modules.pathFor(this.childPackageName(child)),
      currentBrowserFolder,
      config.folder.src
    )) : crossPlatformPath(path.join(
      destination.node_modules.pathFor(this.childPackageName(child)),
      config.folder.src
    ));

    return destPackageLinkSourceLocation;
  }
  //#endregion

  //#region remove or add links
  private addOrRemoveSymlinks(destination: Project, remove = false) {
    for (let index = 0; index < this.children.length; index++) {
      const child = this.children[index];

      const destPackageLinkSourceLocation = this.destPackageLinkSourceLocation(destination, child);
      Helpers.removeIfExists(destPackageLinkSourceLocation);
      if (!remove) {
        Helpers.createSymLink(this.sourcePathToLinkFor(child), destPackageLinkSourceLocation);
      }

      for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {
        const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
        const destPackageLinkSourceLocationForBrowser = this.destPackageLinkSourceLocation(
          destination,
          child,
          currentBrowserFolder,
        );
        Helpers.removeIfExists(destPackageLinkSourceLocationForBrowser);
        if (!remove) {
          Helpers.createSymLink(this.sourcePathToLinkFor(child), destPackageLinkSourceLocationForBrowser);
        }
      }
    }
  }
  //#endregion

  //#region add source symlinks
  addSourceSymlinks(destination: Project) {
    this.addOrRemoveSymlinks(destination);
  }
  //#endregion

  //#region remove source symlinks
  removeSourceSymlinks(destination: Project) {
    this.addOrRemoveSymlinks(destination, true);
  }
  //#endregion

  fixBackendAndBrowserJsMapFilesIn() {
    for (let index = 0; index < this.children.length; index++) {
      const child = this.children[index];
      const destinationPackageLocation = this.localTempProj.node_modules.pathFor(this.childPackageName(child));

      for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {
        const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
        this.fixJsMapFiles(destinationPackageLocation, currentBrowserFolder);
      }

      this.fixJsMapFiles(destinationPackageLocation);
    }
  }

  copyBackendAndBrowserJsMapFilesFromLocalProjTo(destination: Project) {
    const destinationPackageLocation = this.localTempProj.node_modules.pathFor(this.rootPackageName);
    this.copyMapFilesesForModule(destination, destinationPackageLocation);
  }
}
