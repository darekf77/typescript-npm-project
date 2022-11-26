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
    const monitorDir = this.monitoredOutDir(this.project);

    this.initOptions({
      folderPath: [
        monitorDir,
      ],
      folderPathContentCheck: [
        monitorDir
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
  transformMapFile(
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

  //#region monitored out dir
  monitoredOutDir(project: Project): string {
    const proj = project ? project : this.project;
    const monitorDir: string = crossPlatformPath(path.join(
      proj.location,
      this.outDir,
      proj.name,
      this.targetProjNameForOrgBuild,
      this.outDir,
      'libs',
    ));
    return monitorDir;
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

    const monitorDir = isTempLocalProj
      ? this.monitoredOutDir(this.project)
      : this.localTempProjPathes.package(this.rootPackageName);

    const worksapcePackageName = path.basename(destination.location);

    for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {

      const isTargeOrgProjectAction = (path.basename(destination.location) === this.targetProjNameForOrgBuild);

      const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
      const sourceBrowser = this.getSourceFolder(monitorDir, currentBrowserFolder, isTempLocalProj);

      if (isTempLocalProj && isTargeOrgProjectAction) {

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
          // Helpers.log(`[] Fixing files: ${}`)
        }
        Helpers.log('Fixing .d.ts. files done.')
      }
    }


    for (let index = 0; index < CopyMangerHelpers.browserwebsqlFolders.length; index++) {
      const currentBrowserFolder = CopyMangerHelpers.browserwebsqlFolders[index];
      const sourceBrowser = this.getSourceFolder(monitorDir, currentBrowserFolder, isTempLocalProj);

      Helpers.writeFile(path.join(destination.location,
        config.folder.node_modules,
        this.rootPackageName,
        config.file.index_d_ts,
      ),
        `// Plase use: import { < anything > } from `
        + `'@${this.project.name}/<${this.children.map(c => c.name).join('|')}>';\n`
      );

      Helpers.copy(path.join(monitorDir, worksapcePackageName), destination.location, {
        recursive: true,
        overwrite: true,
        omitFolders: [config.folder.browser, config.folder.websql, config.folder.node_modules]
      });

      const browserDest = path.join(
        destination.location,
        currentBrowserFolder
      );

      Helpers.copy(sourceBrowser, browserDest, {
        recursive: true,
        overwrite: true,
      });

      const browserDestPackageJson = path.join(
        destination.location,
        currentBrowserFolder,
        config.file.package_json,
      );
      const packageJsonBrowserDest = Helpers.readJson(browserDestPackageJson, {});
      packageJsonBrowserDest.name = worksapcePackageName;
      Helpers.writeJson(browserDestPackageJson, packageJsonBrowserDest);

      const browserDestPublicApiDest = path.join(
        destination.location,
        currentBrowserFolder,
        'public-api.d.ts',
      );
      Helpers.writeFile(browserDestPublicApiDest,
        (worksapcePackageName === this.targetProjNameForOrgBuild) ? `
export * from './lib';\n
`.trimLeft() : `
export * from './libs/${worksapcePackageName}';\n
`.trimLeft()
      );


      // TODO extract child specyfic things from browser build if it is possible

    }


    Helpers.writeFile(path.join( // override dts to easly debugging
      destination.location,
      config.file.index_d_ts,
    ), `export * from './${this.project.sourceFolder}';\n`);
  }
  //#endregion

  //#region copy source maps
  copySourceMaps(destination: Project, isTempLocalProj: boolean): void {

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

    if (isTempLocalProj) {
      //#region fix files in local temp project
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
            this.monitoredOutDir(this.project),
            crossPlatformPath(f).replace(this.localTempProjPathes.package(this.rootPackageName), ''),
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
          this.monitoredOutDir(this.project),
          crossPlatformPath(f).replace(this.localTempProjPathes.package(this.rootPackageName), ''),
        );

        Helpers.writeFile(
          monitoredOutDirFileToReplaceBack,
          this.transformMapFile(orgContent, false, true)
        );

      });
      Helpers.log('fixing js.maps done...')
      //#endregion
    } else {
      //#region for other project thatn local temp -> copy files from local tmep
      const localTempProjOutFolder = this.localTempProjPathes.package(this.rootPackageName);

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
      //#endregion
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
      this.localTempProjPathes.package(this.rootPackageName),
      specyficFileRelativePath
    ));

    if (!isTempLocalProj) {
      // Helpers.log(`Eqal content with temp proj: ${}`)
      Helpers.copyFile(sourceFileInLocalTempFolder, destinationFile);
      return;
    }

    const sourceFile = crossPlatformPath(path.normalize(path.join(
      this.monitoredOutDir(this.project),
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
              this.monitoredOutDir(this.project),
              crossPlatformPath(sourceFile).replace(this.monitoredOutDir(this.project), ''),
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
              this.monitoredOutDir(this.project),
              crossPlatformPath(sourceFile).replace(this.monitoredOutDir(this.project), ''),
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

  //#region get chhildren
  getChildren(): Project[] {
    return [
      this.project.children.find(c => c.name === this.targetProjNameForOrgBuild),
      ...this.project.children.filter(c => c.name !== this.targetProjNameForOrgBuild),
    ];
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

}
