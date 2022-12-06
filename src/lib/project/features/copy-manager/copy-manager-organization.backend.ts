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

  //#region getters / project to copy to
  get projectToCopyTo() {
    if (Array.isArray(this.copyto) && this.copyto.length > 0) {
      // @ts-ignore
      return [
        this.localTempProj,
        ...this.copyto
      ] as Project[];
    }
    return [this.localTempProj];
  }
  //#endregion

  //#region angular browser compilation folders
  protected readonly angularBrowserComiplationFolders = {
    esm2020: 'esm2020',
    fesm2015: 'fesm2015',
    fesm2020: 'fesm2020',
  };
  protected readonly angularBrowserComiplationFoldersArr = Object.values(this.angularBrowserComiplationFolders);
  //#endregion

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
    return Project.From(this.targetProjPath) as Project;
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

  //#region recreate temp proj
  recreateTempProj() {
    if (!this.targetProjName) {
      // @ts-ignore
      this.args = `${this.project.smartContainerBuildTarget.name} ${this.args}`;
    }
    super.recreateTempProj();
  }
  //#endregion

  //#region _ copy builded distibutino to
  isFirstRun = true;
  _copyBuildedDistributionTo(
    destination: Project,
    options?: {
      specyficFileRelativePath?: string,
      outDir?: Models.dev.BuildDir,
      event?: any,
      files?: string[]
    }
  ) {
    super._copyBuildedDistributionTo(destination, options);
    if ((destination.location === this.localTempProjPath) && this.isFirstRun) {
      this.isFirstRun = false;
      const nodeModules = this.project.node_modules.pathFor(this.rootPackageName);
      Helpers.remove(nodeModules);
      Helpers.createSymLink(this.localTempProj.node_modules.pathFor(this.rootPackageName), nodeModules);
    }
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

  //#region links for packages are ok
  linksForPackageAreOk(destination: Project): boolean {
    return true;
    // TODO QUICKFIX @LAST
    const destPackageLinkSourceLocation = crossPlatformPath(path.join(
      destination.location,
      config.folder.node_modules,
      this.rootPackageName,
      config.folder.src
    ));

    return Helpers.exists(destPackageLinkSourceLocation);
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
      const children = this.children;

      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        if (!child) {
          // debugger
        }
        const childDestPackageInNodeModules = path.join(
          destPackageInNodeModules,
          CopyMangerHelpers.childPureName(child)
        );

        const childDestPackageInNodeModulesBrowser = path.join(
          destPackageInNodeModules,
          CopyMangerHelpers.childPureName(child),
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
    isForLaunchJsonDebugging: boolean,
    absFilePath: string,
  ): string {

    if (!content) {
      Helpers.warn(`[copytomanager] Empty content for ${absFilePath}`);
      return content;
    }

    if (isBrowser) {
      // TODO is angular maps not working in chrome debugger (the did not work whe switch lazy modules)
      // content = content.replace(regex1, `"./${config.folder.src}`);
      // content = content.replace(regex2, config.folder.src);
    } else {
      if (isForLaunchJsonDebugging) { // files is in dist or bundle or container target project
        // I am not allowing organizaition as cli tool
        let toReplaceString2 = `../tmp-source-${this.outDir}`;

        let toReplaceString1 = `"${toReplaceString2}`;

        const regex2 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString2), 'g');
        const relative = absFilePath.replace(`${this.monitoredOutDir}/`, '');

        if (this.isForSpecyficTargetCompilation(relative)) {
          // console.log(`[changeamp] relative: ${relative}`)
          content = content.replace(regex2, `../../../../${this.targetProjName}/${config.folder.src}`);
        } else {
          const childName = relative.startsWith(config.folder.libs) ? _.first(relative.split('/').slice(1)) : void 0;
          // console.log(`[changeamp]
          // childName: ${childName} relative: ${relative}`)
          if (childName) {
            content = content.replace(regex2, `../../../../${childName}/${config.folder.src}/${config.folder.lib}`);
          } else {
            // don not modify anything
          }
        }
      } else { // debugging inside someone else project/node_modules/<pacakge>
        let toReplaceString2 = isBrowser
          ? `../tmp-${config.folder.libs}-for-${this.outDir}/${this.project.name}/projects/${this.project.name}/${config.folder.src}`
          : ((`../../../tmp-${config.folder.source}-${this.outDir}`));

        let toReplaceString1 = `"${toReplaceString2}`;
        const addon = `/${config.folder.libs}/(${this.children.map(c => {
          return Helpers.escapeStringForRegEx(CopyMangerHelpers.childPureName(c));
        }).join('|')})`;

        const regex1 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString1) + addon, 'g');
        const regex2 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString2) + addon, 'g');

        content = content.replace(regex1, `"./${config.folder.src}`);
        content = content.replace(regex2, `${config.folder.src}`);
      }
    }

    return content;
  }
  //#endregion

  fixAngularPackageJson(child: Project, destination: Project, currentBrowserFolder?: Models.dev.BuildDirBrowser) {
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

  //#region fix angular package browser files
  fixAngularBuildRelatedFiles(child: Project, destination: Project, currentBrowserFolder: Models.dev.BuildDirBrowser) {

    const childPackageName = path.join(this.rootPackageName, child.name);
    const rootPackageNameForChildBrowser = path.join(childPackageName, currentBrowserFolder);
    const location = destination.node_modules.pathFor(rootPackageNameForChildBrowser);
    this.fixAngularPackageJson(child, destination, currentBrowserFolder);

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
    // console.log('COPY', {
    //   monitorDirForModuleBrowser, pkgLocInDestNodeModulesForChildBrowser
    // })
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
      ? path.join(this.monitoredOutDir, currentBrowserFolder, config.folder.libs, child.name)
      : this.localTempProj.node_modules.pathFor(rootPackageNameForChildBrowser);

    if (isTempLocalProj) { // when destination === tmp-local-proj => fix d.ts imports in (dist|bundle)
      CopyMangerHelpers.fixingDtsImports(monitorDirForModuleBrowser, this.isomorphicPackages);
    }
    if (child.name !== this.targetProjName) { // target is in lib.... -> no need for target also being in libs
      this.writeSpecyficForChildDtsFiles(destination, rootPackageNameForChildBrowser, monitorDirForModuleBrowser);
    }
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

      //#region  fix file fn
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
      //#endregion

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
    // TODO LAST copy app.ts
    for (let index = 0; index < this.children.length; index++) {
      //#region prepare variables
      const child = this.children[index];
      this.fixAngularPackageJson(child, destination);

      for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {
        const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
        this.fixesForChildDtsFile(destination, isTempLocalProj, child, currentBrowserFolder);
        this.fixAngularBuildRelatedFiles(child, destination, currentBrowserFolder);
        this.copyAngularBrowserFolders(destination, isTempLocalProj, child, currentBrowserFolder);
        //#endregion
      }
    }
  }
  //#endregion

  //#region files for specyfic target
  isForSpecyficTargetCompilation(specyficFileRelativePath: string) {
    specyficFileRelativePath = crossPlatformPath(specyficFileRelativePath).replace(/^\//, '');

    const shouldNotStartWith = [
      ...CopyMangerHelpers.browserwebsqlFolders,
      config.folder.lib,
      config.folder.libs,
      config.folder.node_modules,
      config.folder.src,
    ];
    for (let index = 0; index < shouldNotStartWith.length; index++) {
      const folder = shouldNotStartWith[index];
      if (specyficFileRelativePath.startsWith(folder)) {
        return false;
      }
    }
    return true;
  }

  filesForSpecyficTarget() {
    const base = this.monitoredOutDir;
    const appFiles = Helpers.filesFrom([base, config.folder.app], true);
    const appFlatFiles = Helpers.filesFrom(base);

    const allFiles = [
      ...appFiles,
      ...appFlatFiles,
    ];

    return allFiles;
  }
  //#endregion

  //#region fix additonal files and folder
  fixAdditonalFilesAndFolders(destination: Project) {
    const additonakFiles = this.filesForSpecyficTarget();
    // console.log({
    //   additonakFiles
    // })
    additonakFiles.forEach(specyficFileAbsPath => {
      const specyficFileRelativePath = specyficFileAbsPath.replace(`${this.monitoredOutDir}/`, '');
      if (specyficFileRelativePath.endsWith('.d.ts')) {
        CopyMangerHelpers.browserwebsqlFolders.forEach(currentBrowserFolder => {
          const dtsFileAbsolutePath = crossPlatformPath(path.join(this.monitoredOutDir, specyficFileRelativePath));
          CopyMangerHelpers.writeFixedVersionOfDtsFile(
            dtsFileAbsolutePath,
            currentBrowserFolder,
            this.isomorphicPackages,
          );
        });
      } else if (specyficFileRelativePath.endsWith('.js.map')) {
        this.writeFixedMapFile(true, specyficFileRelativePath, this.monitoredOutDir);
        this.writeFixedMapFile(false, specyficFileRelativePath, this.monitoredOutDir);
      }
    });
  }
  //#endregion

  //#region copy compiled sources and declarations
  copyCompiledSourcesAndDeclarations(destination: Project, isTempLocalProj: boolean) {
    // @LAST
    if (isTempLocalProj) {
      this.fixAdditonalFilesAndFolders(destination);
    }

    for (let index = 0; index < this.children.length; index++) {
      const child = this.children[index];
      const rootPackageNameForChild = path.join(this.rootPackageName, child.name);
      const monitorDirForModule = isTempLocalProj //
        ? path.join(this.monitoredOutDir, config.folder.libs, child.name)
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
    const sourceToLink = crossPlatformPath(path.join(this.project.location, child.name, config.folder.src, config.folder.lib));
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

  //#region fix backend and browser js map files in local project
  fixBackendAndBrowserJsMapFilesInLocalProj() {
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
  //#endregion

  //#region copy backend and browser js map files from local project to destination
  copyBackendAndBrowserJsMapFilesFromLocalProjTo(destination: Project) {
    const destinationPackageLocation = this.localTempProj.node_modules.pathFor(this.rootPackageName);
    this.copyMapFilesesFromLocalToCopyToProj(destination, destinationPackageLocation);
  }
  //#endregion

  //#region write fixed map file for cli
  writeFixedMapFileForCli(
    isForBrowser: boolean,
    specyficFileRelativePath: string,
    destinationPackageLocation: string, // it is local path but is should not be!
  ) {

    // TODO QUICK FIX
    if (crossPlatformPath(destinationPackageLocation) == this.targetProj.pathFor(this.outDir)) {
      super.writeFixedMapFileForCli(isForBrowser, specyficFileRelativePath, destinationPackageLocation);
      return;
    }

    let childName = destinationPackageLocation
      .replace(`${this.localTempProj.node_modules.pathFor(this.rootPackageName)}/`, '');

    let child = this.children.find(c => c.name === childName);
    if (!child) {
      childName = _.first(destinationPackageLocation.split('/').splice(-2));
      child = this.children.find(c => c.name === childName);
    }

    const monitoredOutDirFileToReplaceBack = crossPlatformPath(path.join(
      this.targetProj.pathFor(this.outDir),
      config.folder.libs,
      childName,
      specyficFileRelativePath,
    ))

    // console.log(`tryingfix: ${monitoredOutDirFileToReplaceBack}
    //  "${destinationPackageLocation}" "${specyficFileRelativePath}" child: ${childName}`)

    if (!child) {
      super.writeFixedMapFileForCli(isForBrowser, specyficFileRelativePath, destinationPackageLocation);
      return;
    }

    if (Helpers.exists(monitoredOutDirFileToReplaceBack)) {
      const fixedContentCLIDebug = this.changedJsMapFilesInternalPathesForDebug(
        Helpers.readFile(monitoredOutDirFileToReplaceBack),
        isForBrowser,
        true,
        monitoredOutDirFileToReplaceBack,
      );

      Helpers.writeFile(
        monitoredOutDirFileToReplaceBack,
        fixedContentCLIDebug,
      );
    }
  }
  //#endregion

  //#region handle copy of single file
  handleCopyOfSingleFile(
    destination: Project,
    isTempLocalProj: boolean,
    specyficFileRelativePath: string,
    wasRecrusive = false
  ): void {

    specyficFileRelativePath = specyficFileRelativePath.replace(/^\//, '');

    const orgSpecyficFileRelativePath = specyficFileRelativePath;

    const distOrBundleLocation = crossPlatformPath(path.join(
      this.targetProj.location,
      this.outDir,
    ))
    const absOrgFilePathInDistOrBundle = crossPlatformPath(path.normalize(path.join(
      distOrBundleLocation,
      orgSpecyficFileRelativePath
    )));

    //#region handle addtional files
    if (!specyficFileRelativePath.startsWith(config.folder.libs)) {
      // console.log(`ommiting: ${specyficFileRelativePath}`)

      const isBackendMapsFileAppJS = specyficFileRelativePath.endsWith('.js.map');
      const isBrowserMapsFileAppJS = specyficFileRelativePath.endsWith('.mjs.map');

      this.fixDtsImportsWithWronPackageName(
        absOrgFilePathInDistOrBundle,
        absOrgFilePathInDistOrBundle,
      );

      if (isBackendMapsFileAppJS || isBrowserMapsFileAppJS) {
        if (isBackendMapsFileAppJS) {
          this.writeFixedMapFile(
            false,
            specyficFileRelativePath,
            distOrBundleLocation,
          )
        }
        if (isBrowserMapsFileAppJS) {
          this.writeFixedMapFile(
            true,
            specyficFileRelativePath,
            distOrBundleLocation
          )
        }
      }
      return;
    }
    //#endregion

    const childName = _.first(specyficFileRelativePath.split('/').slice(1));
    const child = this.children.find(c => c.name === childName);

    if (!child) {
      Helpers.warn(`NO CHILD FOR ${specyficFileRelativePath}`);
      return;
    }

    specyficFileRelativePath = specyficFileRelativePath.replace(`${config.folder.libs}/${childName}/`, '');
    const rootPackageNameForChild = path.join(this.rootPackageName, child.name);

    Helpers.log(`Handle single file: ${specyficFileRelativePath} for ${rootPackageNameForChild}`)


    if (this.notAllowedFiles.includes(specyficFileRelativePath)) {
      return;
    }


    if (!wasRecrusive) {
      this.preventWeakDetectionOfchanges(orgSpecyficFileRelativePath, destination, isTempLocalProj);
    }

    const destinationFilePath = crossPlatformPath(path.normalize(path.join(
      destination.node_modules.pathFor(rootPackageNameForChild),
      specyficFileRelativePath
    )));

    if (!isTempLocalProj) {
      const readyToCopyFileInLocalTempProj = crossPlatformPath(path.join(
        this.localTempProj.node_modules.pathFor(rootPackageNameForChild),
        specyficFileRelativePath
      ));
      // Helpers.log(`Eqal content with temp proj: ${}`)
      Helpers.copyFile(readyToCopyFileInLocalTempProj, destinationFilePath);
      return;
    }


    this.fixDtsImportsWithWronPackageName(absOrgFilePathInDistOrBundle, destinationFilePath)


    const isBackendMapsFile = destinationFilePath.endsWith('.js.map');
    const isBrowserMapsFile = destinationFilePath.endsWith('.mjs.map');

    if (isBackendMapsFile || isBrowserMapsFile) {
      if (isBackendMapsFile) {
        this.writeFixedMapFile(
          false,
          specyficFileRelativePath,
          destination.node_modules.pathFor(rootPackageNameForChild),
        )
      }
      if (isBrowserMapsFile) {
        this.writeFixedMapFile(
          true,
          specyficFileRelativePath,
          destination.node_modules.pathFor(rootPackageNameForChild),
        )
      }
    } else {
      Helpers.writeFile(destinationFilePath, (Helpers.readFile(absOrgFilePathInDistOrBundle) || ''));
    }



    // TODO check this
    if (specyficFileRelativePath === config.file.package_json) {
      // TODO this is VSCODE/typescirpt new fucking issue
      // Helpers.copyFile(sourceFile, path.join(path.dirname(destinationFile), config.folder.browser, path.basename(destinationFile)));
    }
  }
  //#endregion

  //#region update backend full dts files
  /**
   * package ready to realse should have all/full *.d.ts files.. .to avoid any
   * erors when we import more "ui package" to backend code
   */
  updateBackendFullDtsFiles(destinationOrBundleOrDist: Project | string) {
    const base = crossPlatformPath(path.join(this.targetProj.location, `${this.outDir}-nocutsrc`, config.folder.libs));

    const filesToUpdate = Helpers
      .filesFrom(base, true)
      .filter(f => f.endsWith('.d.ts'))
      .map(f => f.replace(`${base}/`, ''))

    for (let index = 0; index < filesToUpdate.length; index++) {
      const relativePath = filesToUpdate[index];
      // const childName = _.first(relativePath.split('/'));
      const source = crossPlatformPath(path.join(base, relativePath));
      const dest = crossPlatformPath(path.join(
        _.isString(destinationOrBundleOrDist)
          ? crossPlatformPath(path.join(this.monitoredOutDir, config.folder.libs))
          : destinationOrBundleOrDist.node_modules.pathFor(crossPlatformPath(path.join(
            this.rootPackageName,
            // childName,
          ))),
        relativePath,
      ));
      // if (Helpers.exists(dest)) {
      //   console.log(dest)
      Helpers.copyFile(source, dest);
      // }
    }
  }
  //#endregion

}
