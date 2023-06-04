//#region imports
import { crossPlatformPath, _ } from 'tnp-core';
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import { config } from 'tnp-config';
import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';;
import { FeatureCompilerForProject } from '../../abstract';
import { CopyMangerHelpers } from './copy-manager-helpers.backend';
import { IncCompiler } from 'incremental-compiler';
import { Log } from 'ng2-logger';
import { SourceMappingUrl } from './source-maping-url.backend';

const log = Log.create(_.startCase(path.basename(__filename)));
//#endregion

export abstract class BaseCopyManger extends FeatureCompilerForProject {

  //#region fields
  private readonly _isomorphicPackages = [] as string[];
  protected readonly copyto: Project[] = [];
  protected readonly args: string;
  readonly outDir: Models.dev.BuildDir;
  protected readonly watch: boolean;
  protected readonly nodts: boolean;
  protected readonly renameDestinationFolder?: string;

  get customCompilerName() {
    return `Copyto manager compilation`;
  }

  protected readonly notAllowedFiles = [
    '.DS_Store',
    config.file.index_d_ts,
  ];

  protected readonly sourceFolders = [
    config.folder.src,
    config.folder.node_modules,
    config.folder.tempSrcDist,
    config.file.package_json,
    ...CopyMangerHelpers.browserwebsqlFolders.map(currentBrowserFolder => {
      return crossPlatformPath(path.join(currentBrowserFolder, config.folder.src))
    }),
    // probably is not needed -> I ma not using bundle for node_modules
    crossPlatformPath(path.join(config.folder.client, config.file.package_json)),
  ];

  //#endregion

  //#region getters

  //#region getters / source path to link

  get sourcePathToLink() {
    const sourceToLink = crossPlatformPath(path.join(this.project.location, config.folder.src));
    return sourceToLink;
  }
  //#endregion

  //#region getters / temp project name
  get tempProjName() {
    const tempProjName = this.project.getTempProjName(this.outDir);
    return tempProjName;
  }
  //#endregion

  //#region getters / local temp proj path
  get localTempProj() {
    let localProj = Project.From(this.localTempProjPath) as Project;
    return localProj;
  }
  //#endregion

  //#region getters / project to copy to
  get projectToCopyTo() {
    const canCopyToNodeModules = (this.outDir === 'dist');
    let result = [];

    if (Array.isArray(this.copyto) && this.copyto.length > 0) {
      // @ts-ignore
      result = [
        this.localTempProj,
        ...this.copyto,
        ...(canCopyToNodeModules ? [this.project] : []),
      ] as Project[];
    } else {
      result = [
        this.localTempProj,
        ...(canCopyToNodeModules ? [this.project] : []),
      ];
    }
    return Helpers.arrays.uniqArray<Project>(result, 'location');
  }
  //#endregion

  get projectWithBuild() {
    return this.project.isStandaloneProject ? this.project : this.project.smartContainerBuildTarget;
  }

  //#region getters / isomorphic pacakges
  get isomorphicPackages() {
    const isomorphicPackages = [
      ...this._isomorphicPackages,
      this.rootPackageName,
    ];
    return isomorphicPackages;
  }
  //#endregion
  //#endregion

  //#region generate source copy in
  public generateSourceCopyIn(destinationLocation: string,
    options?: Models.other.GenerateProjectCopyOpt): boolean {
    destinationLocation = crossPlatformPath(destinationLocation);
    //#region fix options
    if (_.isUndefined(options)) {
      options = {} as any;
    }
    if (_.isUndefined(options.filterForBundle)) {
      options.filterForBundle = true;
    }
    if (_.isUndefined(options.forceCopyPackageJSON)) {
      options.forceCopyPackageJSON = false;
    }
    if (_.isUndefined(options.ommitSourceCode)) {
      options.ommitSourceCode = false;
    }
    if (_.isUndefined(options.override)) {
      options.override = true;
    }
    if (_.isUndefined(options.showInfo)) {
      options.showInfo = true;
    }
    if (_.isUndefined(options.regenerateProjectChilds)) {
      options.regenerateProjectChilds = false;
    }
    if (_.isUndefined(options.useTempLocation)) {
      options.useTempLocation = true;
    }
    if (_.isUndefined(options.markAsGenerated)) {
      options.markAsGenerated = true;
    }
    if (_.isUndefined(options.regenerateOnlyCoreProjects)) {
      options.regenerateOnlyCoreProjects = true;
    }
    //#endregion

    const { override, showInfo, markAsGenerated } = options;

    const sourceLocation = this.project.location;
    //#region modify package.json for generated
    var packageJson: Models.npm.IPackageJSON = fse.readJsonSync(path.join(
      sourceLocation,
      config.file.package_json
    ), {
      encoding: 'utf8'
    });
    if (markAsGenerated && packageJson && packageJson.tnp) {
      packageJson.tnp.isGenerated = true;
    }
    if (this.project.isContainerWorkspaceRelated || options.forceCopyPackageJSON) {
      if (this.project.isWorkspace && markAsGenerated) {
        packageJson.tnp.isCoreProject = false;
      }
    }
    //#endregion

    //#region execute copy
    if (fse.existsSync(destinationLocation)) {
      if (override) {
        Helpers.tryRemoveDir(destinationLocation);
        Helpers.mkdirp(destinationLocation);
      } else {
        if (showInfo) {
          Helpers.warn(`Destination for project "${this.project.name}" already exists, only: source copy`);
        };
      }
    }

    CopyMangerHelpers.executeCopy(sourceLocation, destinationLocation, options, this.project);
    //#endregion

    //#region handle additional package.json markings
    if (this.project.isContainerWorkspaceRelated || this.project.isVscodeExtension || options.forceCopyPackageJSON) {
      const packageJsonLocation = crossPlatformPath(path.join(destinationLocation, config.file.package_json));
      // console.log(`packageJsonLocation: ${ packageJsonLocation } `)
      // console.log('packageJson', packageJson)
      fse.writeJsonSync(packageJsonLocation, packageJson, {
        spaces: 2,
        encoding: 'utf8'
      });
      // console.log(`packageJsonLocation saved: ${ packageJsonLocation } `)
    }
    if (this.project.isWorkspace) {
      if (options.markAsGenerated) {
        Helpers.writeFile(path.resolve(path.join(destinationLocation, '../info.txt')), `
    This workspace is generated.
    `);
      } else {
        Helpers.writeFile(path.resolve(path.join(destinationLocation, '../info.txt')), `
    This is container for workspaces.
    `);
      }
    }
    //#endregion

    if (showInfo) {
      //#region show info about generation
      let dir = path.basename(path.dirname(destinationLocation));
      if (fse.existsSync(path.dirname(path.dirname(destinationLocation)))) {
        dir = `${path.basename(path.dirname(path.dirname(destinationLocation)))}/${dir}`
      }
      Helpers.log(`Source of project "${this.project.genericName}" generated in ${dir} /(< here >) `);
      //#endregion
    }

    //#region recrusive execution for childrens
    if (options.regenerateProjectChilds && this.project.isContainerWorkspaceRelated) {
      let childs = this.project.children.filter(f => !['lib', 'app'].includes(path.basename(f.location)));

      if (options.regenerateOnlyCoreProjects) {
        if (this.project.isCoreProject || this.project.isSmartContainer) {
          if (this.project.isSmartContainer) {
            childs = this.project.children.filter(c => c.typeIs('isomorphic-lib') && c.frameworkVersionAtLeast('v3'));
          } else if (this.project.isContainer) {
            childs = this.project.children.filter(c => c.name === 'workspace');
          } else if (this.project.isWorkspace) {
            childs = this.project.children.filter(c => config.projectTypes.forNpmLibs.includes(c.name as any));
          }
        } else {
          childs = [];
        }
      }

      childs.forEach(c => {
        // console.log('GENERATING CHILD ' + c.genericName)
        c.copyManager.generateSourceCopyIn(crossPlatformPath(path.join(destinationLocation, c.name)), options);

      });
      if (this.project.isSmartContainer) {
        childs.forEach(c => {
          let generatedVer = Project.From(crossPlatformPath(path.join(destinationLocation, c.name))) as Project;
          generatedVer.packageJson.data.tnp = {
            type: 'isomorphic-lib',
            version: "v3",
          } as any;
          generatedVer.packageJson.save('saving proper child version');
          Project.unload(generatedVer);
          generatedVer = Project.From(crossPlatformPath(path.join(destinationLocation, c.name)));
        });
      }
    }
    //#endregion

    return true;
  }
  //#endregion

  //#region async action
  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change) {
    const absoluteFilePath = crossPlatformPath(event.fileAbsolutePath);
    // console.log('async event '+ absoluteFilePath)
    SourceMappingUrl.fixContent(absoluteFilePath, this.projectWithBuild);

    const outDir = this.outDir;
    let specyficFileRelativePath: string;
    let absoluteAssetFilePath: string;
    if (absoluteFilePath.startsWith(this.monitoredOutDir)) {
      specyficFileRelativePath = absoluteFilePath.replace(this.monitoredOutDir + '/', '');
    } else {
      absoluteAssetFilePath = absoluteFilePath;
    }


    Helpers.log(`ASYNC ACTION
    absoluteFilePath: ${absoluteFilePath}
    specyficFileRelativePath: ${specyficFileRelativePath}
    `);
    const projectToCopyTo = this.projectToCopyTo;

    for (let index = 0; index < projectToCopyTo.length; index++) {
      const projectToCopy = projectToCopyTo[index];
      this._copyBuildedDistributionTo(projectToCopy,
        {
          absoluteAssetFilePath,
          specyficFileRelativePath: event && specyficFileRelativePath,
          outDir: outDir as any,
          event
        }
      );
    }
  }
  //#endregion

  //#region sync action
  async syncAction(
    // files: string[]
  ) {
    Helpers.log('SYNC ACTION');
    const outDir = this.outDir;

    const projectToCopyTo = this.projectToCopyTo;

    for (let index = 0; index < projectToCopyTo.length; index++) {
      const projectToCopy = projectToCopyTo[index];
      log.data(`copying to ${projectToCopy?.name}`)
      this._copyBuildedDistributionTo(projectToCopy,
        {
          outDir: outDir as any,
        }
      );
      log.data('copy done...')
    }
  }
  //#endregion

  //#region copy builded distribution to
  public copyBuildedDistributionTo(destination: Project) {
    return this._copyBuildedDistributionTo(destination);
  }
  /**
  * There are 3 typese of --copyto build
  * 1. dist build (wihout source maps buit without links)
  * 2. dist build (with source maps and links) - when no buildOptions
  * 3. same as 2 buit with watch
  */
  protected _copyBuildedDistributionTo(
    destination: Project,
    options?: {
      absoluteAssetFilePath?: string,
      specyficFileRelativePath?: string,
      outDir?: Models.dev.BuildDir,
      event?: any,
    }
  ) {

    //#region init & prepare parameters
    const { specyficFileRelativePath = void 0, absoluteAssetFilePath = void 0, outDir, event } = options || {};

    // if (!specyficFileRelativePath) {
    //   debugger
    //   Helpers.warn(`Invalid project: ${destination?.name}`)
    //   return;
    // }
    if (!destination || !destination?.location) {
      Helpers.warn(`Invalid project: ${destination?.name}`)
      return;
    }

    const isTempLocalProj = (destination.location === this.localTempProjPath);


    if (!specyficFileRelativePath) {
      this.initalFixForDestination(destination);
    }

    const allFolderLinksExists = !this.watch ? true : this.linksForPackageAreOk(destination);

    // if(specyficFileRelativePath) {
    //   Helpers.log(`[${destination?.name}] Specyfic file change (allFolderLinksExists=${allFolderLinksExists}) (event:${event})`
    //   + ` ${outDir}${specyficFileRelativePath}`);
    // }
    //#endregion

    if ((specyficFileRelativePath || absoluteAssetFilePath) && allFolderLinksExists) {
      if (absoluteAssetFilePath) {
        this.handleCopyOfAssetFile(absoluteAssetFilePath, destination);
      } else {
        //#region handle single file

        this.handleCopyOfSingleFile(destination, isTempLocalProj, specyficFileRelativePath);
        //#endregion
      }

    } else {

      //#region handle all files
      log.data('copying all files')
      this.copyCompiledSourcesAndDeclarations(destination, isTempLocalProj);
      log.d('copying surce maps')
      this.copySourceMaps(destination, isTempLocalProj);
      this.copySharedAssets(destination, isTempLocalProj);

      if (this.watch || isTempLocalProj) {
        log.data('addiing links')
        this.addSourceSymlinks(destination);
      } else {
        log.data('removing links');
        this.removeSourceSymlinks(destination)
      }

      if (!this.nodts) {
        if (!this.watch) {
          this.updateBackendFullDtsFiles(this.monitoredOutDir);
        }
        this.updateBackendFullDtsFiles(destination);
      }

      // TODO not working werid tsc issue with browser/index
      // {const projectOudBorwserSrc = path.join(destination.location,
      //   config.folder.node_modules,
      //   rootPackageName,
      //   config.file.package_json
      // );
      // const projectOudBorwserDest = path.join(destination.location,
      //   config.folder.node_modules,
      //   rootPackageName,
      //   config.folder.browser,
      //   config.file.package_json
      // );
      // Helpers.copyFile(projectOudBorwserSrc, projectOudBorwserDest);}
      //#endregion
    }

  }
  //#endregion

  //#region abstract
  abstract get rootPackageName(): string;
  /**
   * Path for local-temp-project-path
   */
  abstract get localTempProjPath(): string;
  /**
   * connected with specyficRelativeFilePath
   * gives file in compilation folder... meaning:
   *
   * monitoredOutDir/specyficRelativeFilePath
   * equals:
   * projectLocation/(dist|bundle)/specyficRelativeFilePath
   */
  abstract get monitoredOutDir(): string;

  abstract changedJsMapFilesInternalPathesForDebug(
    content: string,
    isBrowser: boolean,
    isForCliDebuggerToWork: boolean,
    filePath: string,
  ): string

  abstract initalFixForDestination(destination: Project): void;
  abstract copySourceMaps(destination: Project, isTempLocalProj: boolean);
  abstract addSourceSymlinks(destination: Project);
  abstract removeSourceSymlinks(destination: Project);
  abstract handleCopyOfSingleFile(destination: Project, isTempLocalProj: boolean, specyficFileRelativePath: string);
  abstract handleCopyOfAssetFile(absoluteAssetFilePath: string, destination: Project);
  /**
   * fix d.ts files in angular build - problem with require() in d.ts with wrong name
   */
  abstract copyCompiledSourcesAndDeclarations(destination: Project, isTempLocalProj: boolean);
  abstract copySharedAssets(destination: Project, isTempLocalProj: boolean);
  abstract linksForPackageAreOk(destination: Project): boolean;
  abstract updateBackendFullDtsFiles(destinationOrBundleOrDist: Project | string): void;

  //#endregion

}
