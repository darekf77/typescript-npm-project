//#region imports
import { _ } from 'tnp-core';
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import { glob } from 'tnp-core';
import chalk from 'chalk';
import { os } from 'tnp-core';
import { chokidar } from 'tnp-core';
import { config, ConfigModels } from 'tnp-config';
import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';;
import { BuildOptions, TnpDB } from 'tnp-db';
import { FeatureForProject } from '../../abstract';
import { CopyMangerHelpers } from './copy-manager-helpers.backend';
//#endregion

export class CopyManager extends FeatureForProject {

  //#region fields & getters
  private buildOptions: BuildOptions;

  private modifyPackageFile: { fileRelativePath: string; modifyFn: (d: any) => any }[];

  get target() {
    const target = _.first((this.buildOptions.args || '').split(' ')).replace('/', '')
    return target;
  }

  get projectToCopyTo() {
    if (Array.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0) {
      // @ts-ignore
      return this.buildOptions.copyto as Project[];
    }
    return [];
  }

  get isOrganizationPackageBuild() {
    const isOrganizationPackageBuild = this.project.isSmartContainer;
    return isOrganizationPackageBuild;
  }

  //#endregion

  //#region init

  private renameDestinationFolder?: string;
  public async initCopyingOnBuildFinish(buildOptions: BuildOptions,
    modifyPackageFile?: { fileRelativePath: string; modifyFn: (d: any) => any }[],
    renameDestinationFolder?: string,
  ) {
    this.modifyPackageFile = modifyPackageFile;
    this.renameDestinationFolder = renameDestinationFolder;
    this.buildOptions = buildOptions;
    const { watch } = buildOptions;

    if (!Array.isArray(this.buildOptions.copyto)) {
      this.buildOptions.copyto = [];
    }

    if (this.buildOptions.copyto.length === 0) {
      Helpers.log(`No need to --copyto on build finsh... `)
      return;
    }
    if (watch) {
      await this.start();
      await this.watch();

      // TODO update this when expressjs server for each build
      // const db = await TnpDB.Instance();

      // const updateFromDbLastCommand = (channel: string) => async () => {
      //   Helpers.log(`Trigger of updateFromDbLastCommand`);
      //   const db = await TnpDB.Instance();
      //   const cmd = (await db.getCommands()).find(c => c.isBuildCommand && c.location === Project.Current.location);
      //   if (cmd) {
      //     // @ts-ignore
      //     const b = await BuildOptions.from(cmd.command, Project.Current);
      //     Helpers.info(`

      //     COPYTO UPDATED: "${channel}"

      //     from: ${
      //       // @ts-ignore
      //       (this.buildOptions.copyto as Project[]).map(c => c.name).join(', ')
      //       }

      //     to: ${
      //       // @ts-ignore
      //       (b.copyto as Project[]).map(c => c.name).join(', ')
      //       }

      // `)
      //     this.buildOptions.copyto = Helpers.arrays.uniqArray<Project>(b.copyto, 'location');
      //     await db.updateCommandBuildOptions(cmd.location, this.buildOptions);
      //   }
      // }

      // if (process.platform !== 'win32') { // TODO QUICK_FIX
      //   // @ts-ignore
      //   db.listenToChannel(this.project, 'tnp-copyto-add', async () => {
      //     Helpers.log(`[copytomanager] realtime update add`);
      //     await updateFromDbLastCommand('tnp-copyto-add')();
      //   });

      //   // @ts-ignore
      //   db.listenToChannel(this.project, 'tnp-copyto-remove', async () => {
      //     Helpers.log(`[copytomanager] realtime update remove`);
      //     await updateFromDbLastCommand('tnp-copyto-remove')();
      //   });
      // }


    } else {
      await this.start();
    }

  }
  //#endregion

  //#region start
  private async start(
    event?: ConfigModels.FileEvent,
    specyficFileRelativePath?: string
  ) {
    const outDir = this.buildOptions.outDir;

    const projectToCopyTo = this.projectToCopyTo;

    for (let index = 0; index < projectToCopyTo.length; index++) {
      const p = projectToCopyTo[index];
      this._copyBuildedDistributionTo(p,
        {
          specyficFileRelativePath: event && specyficFileRelativePath,
          outDir: outDir as any
        }
      );
    }

  }
  //#endregion

  //#region start and watch

  // TODO make it getter

  private monitoredOutDir(outDir: 'dist' | 'bundle' | 'docs') {
    const monitorDir: string = (this.project.isSmartContainer)
      ? path.join(this.project.location, 'dist', this.project.name, this.target, outDir, 'libs')
      : path.join(this.project.location, outDir);
    return monitorDir;
  }
  private watch() {
    const monitorDir = this.monitoredOutDir(this.buildOptions.outDir);

    Helpers.log(`[copytomanger] watching folder for as copy source!! ${monitorDir} `)

    if (fse.existsSync(monitorDir)) {
      chokidar.watch(monitorDir, {
        followSymlinks: false
      }).on('change', (f) => {
        if (_.isString(f)) {
          f = f.replace(monitorDir, '') as any
          // console.log(f)
        }
        this.start('changed', f as any);
      }).on('add', f => {
        if (_.isString(f)) {
          f = f.replace(monitorDir, '') as any
          // console.log(f)
        }
        this.start('created', f as any);
      }).on('unlink', f => { // TODO @LAST better handle UNLIN
        if (_.isString(f)) {
          f = f.replace(monitorDir, '') as any
          // console.log(f)
        }
        this.start('removed', f as any);
      })

    } else {
      Helpers.log(`Waiting for outdir: ${this.buildOptions.outDir}, monitor Dir: ${monitorDir} `);
      setTimeout(() => {
        this.watch();
      }, 1000);
    }
  }
  //#endregion

  //#region generate source copy in
  public generateSourceCopyIn(destinationLocation: string,
    options?: Models.other.GenerateProjectCopyOpt): boolean {
    // if (this.project.isWorkspace) {
    //   console.log('GENERATING WORKSPACE')
    // }

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

    const { override, showInfo, markAsGenerated } = options;

    const sourceLocation = this.project.location;
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

    if (this.project.isContainerWorkspaceRelated || this.project.isVscodeExtension || options.forceCopyPackageJSON) {
      const packageJsonLocation = path.join(destinationLocation, config.file.package_json);
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

    if (showInfo) {
      let dir = path.basename(path.dirname(destinationLocation));
      if (fse.existsSync(path.dirname(path.dirname(destinationLocation)))) {
        dir = `${path.basename(path.dirname(path.dirname(destinationLocation)))}/${dir}`
      }
      Helpers.info(`Source of project "${this.project.genericName}" generated in ${dir} /(< here >) `)
    }


    if (options.regenerateProjectChilds && this.project.isContainerWorkspaceRelated) {
      let childs = this.project.children.filter(f => !['lib', 'app'].includes(path.basename(f.location)));

      if (options.regenerateOnlyCoreProjects) {
        if (this.project.isCoreProject) {
          if (this.project.isContainer) {
            childs = this.project.children.filter(c => c.name === 'workspace');
          }

          if (this.project.isWorkspace) {
            childs = this.project.children.filter(c => config.projectTypes.forNpmLibs.includes(c.name as any));
          }
        } else {
          childs = [];
        }
      }

      childs.forEach(c => {
        // console.log('GENERATING CHILD ' + c.genericName)
        c.copyManager.generateSourceCopyIn(path.join(destinationLocation, c.name), options);
      });
    }

    return true;
  }
  //#endregion

  //#region copy build distribution to
  public copyBuildedDistributionTo(destination: Project) {
    return this._copyBuildedDistributionTo(destination);
  }

  /**
  * There are 3 typese of --copyto build
  * 1. dist build (wihout source maps buit without links)
  * 2. dist build (with source maps and links) - when no buildOptions
  * 3. same as 2 buit with watch
  */
  private _copyBuildedDistributionTo(
    destination: Project,
    options?: {
      specyficFileRelativePath?: string,
      outDir?: 'dist'
    }
  ) {
    const { specyficFileRelativePath = void 0, outDir = 'dist' } = options || {};

    if (!specyficFileRelativePath && (!destination || !destination.location)) {
      Helpers.warn(`Invalid project: ${destination.name}`)
      return;
    }

    const isOrganizationPackageBuild = this.isOrganizationPackageBuild;
    const children = this.project.children;

    const rootPackageName = ((_.isString(this.renameDestinationFolder) && this.renameDestinationFolder !== '') ?
      this.renameDestinationFolder
      : (this.isOrganizationPackageBuild ? `@${this.project.name}` : this.project.name)
    );

    const folderToLinkFromRootLocation = [
      config.folder.src,
    ];

    const isSourceMapsDistBuild = (outDir === 'dist' && (_.isUndefined(this.buildOptions) || this.buildOptions?.watch));

    this.initalFix({
      isOrganizationPackageBuild,
      destination,
      rootPackageName,
      children,
    });

    const allFolderLinksExists = !isSourceMapsDistBuild ? true : this.handleLinksToSourceInCopiedPackage({
      mode: 'check-dest-packge-source-link-ok',
      isOrganizationPackageBuild,
      destination,
      rootPackageName: rootPackageName,
      folderToLinkFromRootLocation,
      children,
      outDir,
    });


    if (specyficFileRelativePath && allFolderLinksExists) {

      //#region handle single file
      const notAllowedFiles = [
        '.DS_Store',
        config.file.index_d_ts,
      ]

      let destinationFile = path.normalize(path.join(destination.location,
        config.folder.node_modules,
        rootPackageName,
        specyficFileRelativePath
      ));

      const relativePath = specyficFileRelativePath.replace(/^\//, '');
      const isBackendMapsFile = destinationFile.endsWith('.js.map');
      const isBrowserMapsFile = destinationFile.endsWith('.mjs.map');

      const sourceFile = isOrganizationPackageBuild
        ? path.normalize(path.join(// ORGANIZATION
          this.monitoredOutDir(outDir),
          specyficFileRelativePath
        )
        ) : path.normalize(path.join(
          this.project.location,
          outDir,
          specyficFileRelativePath
        ));

      if (isSourceMapsDistBuild) {

        if (isBackendMapsFile || isBrowserMapsFile) {

          let content = (Helpers.readFile(sourceFile) || '');

          if (isBackendMapsFile) {
            content = this.transformMapFile({
              children, content, outDir, isOrganizationPackageBuild, isBrowser: false
            });
          }
          if (isBrowserMapsFile) {
            content = this.transformMapFile({
              children, content, outDir, isOrganizationPackageBuild, isBrowser: true
            });
          }

          Helpers.writeFile(destinationFile, content);
        } else if (!notAllowedFiles.includes(relativePath)) { // don't override index.d.ts
          Helpers.copyFile(sourceFile, destinationFile);
        }

      } else {
        Helpers.copyFile(sourceFile, destinationFile);
      }


      if (relativePath === config.file.package_json) {
        // TODO this is VSCODE/typescirpt new fucking issue
        // Helpers.copyFile(sourceFile, path.join(path.dirname(destinationFile), config.folder.browser, path.basename(destinationFile)));
      }
      //#endregion
    } else {

      this.handleLinksToSourceInCopiedPackage({
        mode: 'copy-compiled-source-and-declarations',
        destination,
        folderToLinkFromRootLocation,
        isOrganizationPackageBuild,
        rootPackageName,
        children,
        outDir,
      });

      if (isSourceMapsDistBuild) {

        this.handleLinksToSourceInCopiedPackage({
          mode: 'add-links',
          destination,
          folderToLinkFromRootLocation,
          isOrganizationPackageBuild,
          rootPackageName,
          children,
          outDir,
        });

        this.handleLinksToSourceInCopiedPackage({
          mode: 'copy-source-maps',
          destination,
          folderToLinkFromRootLocation,
          isOrganizationPackageBuild,
          rootPackageName,
          children,
          outDir,
        });

      } else {
        this.handleLinksToSourceInCopiedPackage({
          mode: 'remove-links',
          destination,
          folderToLinkFromRootLocation,
          isOrganizationPackageBuild,
          rootPackageName,
          children,
          outDir,
        });
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

  //#region private methods

  //#region private methods / initial fix
  private initalFix(options: {
    isOrganizationPackageBuild: boolean;
    destination: Project,
    rootPackageName: string,
    children: Project[],
  }) {
    const {
      isOrganizationPackageBuild,
      destination,
      rootPackageName,
      children,
    } = options;
    const destPackageInNodeModules = path.join(destination.location, config.folder.node_modules, rootPackageName);
    const destPackageInNodeModulesBrowser = path.join(destPackageInNodeModules, config.folder.browser);
    if (isOrganizationPackageBuild) {
      Helpers.remove(destPackageInNodeModulesBrowser);
    } else {
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

    if (isOrganizationPackageBuild) {
      for (let index = 0; index < children.length; index++) {
        const c = children[index];
        const childDestPackageInNodeModules = path.join(destPackageInNodeModules, childPureName(c))
        const childDestPackageInNodeModulesBrowser = path.join(destPackageInNodeModules, childPureName(c), config.folder.browser);
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

  //#region private methods / transfor map file
  private transformMapFile(options: {
    content: string;
    outDir: 'dist' | 'bundle' | 'docs';
    isOrganizationPackageBuild: boolean;
    isBrowser: boolean;
    children: Project[];
  }) {
    const {
      isOrganizationPackageBuild,
      isBrowser,
      outDir,
      children,
    } = options;
    let { content } = options;
    if (isOrganizationPackageBuild) {
      let toReplaceString2 = isBrowser
        ? `../tmp-libs-for-${outDir}/${this.project.name}/projects/${this.project.name}/${config.folder.src}`
        : `../../../tmp-source-${outDir}`;

      let toReplaceString1 = `"${toReplaceString2}`;
      const addon = `/libs/(${children.map(c => Helpers.escapeStringForRegEx(childPureName(c))).join('|')})`;
      const regex1 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString1) + addon, 'g');
      const regex2 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString2) + addon, 'g');

      if (isBrowser) { // TODO replace browser doesnt make sense ?? - for now yes
        // content = content.replace(regex1, `"./${config.folder.src}`);
        // content = content.replace(regex2, config.folder.src);
      } else {
        content = content.replace(regex1, `"./${config.folder.src}`);
        content = content.replace(regex2, config.folder.src);
      }

    } else {
      let toReplaceString2 = isBrowser
        ? `../tmp-libs-for-${outDir}/${this.project.name}/projects/${this.project.name}/${config.folder.src}`
        : `../tmp-source-${outDir}`;

      let toReplaceString1 = `"${toReplaceString2}`;
      const regex1 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString1), 'g');
      const regex2 = new RegExp(Helpers.escapeStringForRegEx(toReplaceString2), 'g');

      if (isBrowser) { // TODO replace browser doesnt make sense ?? - for now yes
        // content = content.replace(regex1, `"./${config.folder.src}`);
        // content = content.replace(regex2, config.folder.src);
      } else {
        content = content.replace(regex1, `"./${config.folder.src}`);
        content = content.replace(regex2, config.folder.src);
      }
    }

    return content;
  }
  //#endregion

  //#region private methods / remove links to source in copied packages
  private handleLinksToSourceInCopiedPackage(options: {
    isOrganizationPackageBuild: boolean;
    destination: Project;
    folderToLinkFromRootLocation: string[];
    rootPackageName: string;
    children: Project[],
    mode: 'remove-links'
    | 'add-links'
    | 'check-dest-packge-source-link-ok'
    | 'copy-source-maps'
    | 'copy-compiled-source-and-declarations',
    outDir: 'dist' | 'bundle' | 'docs'
  }) {
    const {
      isOrganizationPackageBuild,
      destination,
      folderToLinkFromRootLocation,
      rootPackageName,
      mode,
      children,
      outDir
    } = options;

    //#region action
    const action = (options: {
      sourceFolder: string;
      sourceToLink: string;
      destPackageLinkSourceLocation: string;
    }, parent?: Project) => {
      const {
        sourceFolder,
        sourceToLink,
        destPackageLinkSourceLocation,
      } = options;
      const destPackageLocation = path.dirname(destPackageLinkSourceLocation);

      if (mode === 'remove-links') {
        //#region remove links to sources in destination packages
        Helpers.removeIfExists(destPackageLinkSourceLocation);
        //#endregion
      }
      if (mode === 'add-links') {
        //#region add links to source in destination packges
        Helpers.removeIfExists(destPackageLinkSourceLocation);
        Helpers.createSymLink(sourceToLink, destPackageLinkSourceLocation);
        //#endregion
      }
      if (mode == 'check-dest-packge-source-link-ok') {
        //#region check if destination pacakage has proper links to sources
        return Helpers.exists(destPackageLinkSourceLocation)
        //#endregion
      }
      if (mode === 'copy-source-maps') {
        //#region copy source maps

        glob.sync(`${destPackageLocation}/${config.folder.browser}/**/*.mjs.map`)
          .forEach(f => {
            let content = Helpers.readFile(f);
            content = this.transformMapFile({
              content, outDir, isOrganizationPackageBuild, isBrowser: true, children
            });
            Helpers.writeFile(f, content);
          });

        glob.sync(`${destPackageLocation}/**/*.js.map`,
          { ignore: [`${config.folder.browser}/**/*.*`] })
          .forEach(f => {
            let content = Helpers.readFile(f);
            content = this.transformMapFile({
              content, outDir, isOrganizationPackageBuild, isBrowser: false, children
            });
            Helpers.writeFile(f, content);
          });
        //#endregion
      }
      if (mode === 'copy-compiled-source-and-declarations') {

        Helpers.writeFile(path.join(
          destPackageLocation,
          config.file.index_d_ts,
        ), `export * from './${this.project.sourceFolder}';\n`);

        const monitorDir = this.monitoredOutDir(outDir);
        const worksapcePackageName = path.basename(destPackageLocation);

        if (isOrganizationPackageBuild) {
          Helpers.copy(path.join(monitorDir, worksapcePackageName), destPackageLocation, {
            recursive: true,
            overwrite: true,
            omitFolders: [config.folder.browser, config.folder.node_modules]
          });
          const sourceBrowser = path.join(path.dirname(monitorDir), config.folder.browser);
          const browserDest = path.join(destPackageLocation, config.folder.browser);

          Helpers.copy(sourceBrowser, browserDest, {
            recursive: true,
            overwrite: true,
          });

          const browserDestPackageJson = path.join(
            destPackageLocation,
            config.folder.browser,
            config.file.package_json,
          );
          const packageJsonBrowserDest = Helpers.readJson(browserDestPackageJson, {});
          packageJsonBrowserDest.name = worksapcePackageName;
          Helpers.writeJson(browserDestPackageJson, packageJsonBrowserDest);

          const browserDestPublicApiDest = path.join(
            destPackageLocation,
            config.folder.browser,
            'public-api.d.ts',
          );
          Helpers.writeFile(browserDestPublicApiDest,
            (worksapcePackageName === this.target) ? `
export * from './lib';\n
`.trimLeft() : `
export * from './libs/${worksapcePackageName}';\n
`.trimLeft()
          );

          // TODO @LAST extract child specyfic things from browser build

        } else {
          Helpers.tryCopyFrom(monitorDir, destPackageLocation);
        }

      }
    };
    //#endregion

    if (isOrganizationPackageBuild && (mode === 'copy-compiled-source-and-declarations')) {
      Helpers.writeFile(path.join(destination.location,
        config.folder.node_modules,
        rootPackageName,
        config.file.index_d_ts,
      ),
        `// Plase use: import { < anything > } from '@${this.project.name}/<${children.map(c => c.name).join('|')}>';\n`
      );
    }

    for (let index = 0; index < folderToLinkFromRootLocation.length; index++) {
      const sourceFolder = folderToLinkFromRootLocation[index];
      if (isOrganizationPackageBuild) {
        children.forEach(c => {
          const childName = childPureName(c);
          const sourceToLink = path.join(c.location, sourceFolder);
          const destPackageLinkSourceLocation = path.join(destination.location,
            config.folder.node_modules,
            rootPackageName,
            childName,
            sourceFolder
          );

          const res = action({
            sourceFolder, sourceToLink, destPackageLinkSourceLocation
          }, this.project);
          if ((mode === 'check-dest-packge-source-link-ok') && !res) {
            return false;
          }

        })
      } else {
        const sourceToLink = path.join(this.project.location, sourceFolder);
        const destPackageLinkSourceLocation = path.join(destination.location,
          config.folder.node_modules,
          rootPackageName,
          sourceFolder
        );
        const res = action({
          sourceFolder, sourceToLink, destPackageLinkSourceLocation
        });
        if ((mode === 'check-dest-packge-source-link-ok') && !res) {
          return false;
        }
      }
    }
    return true;
  }
  //#endregion

  //#endregion

}


function childPureName(child: Project) {
  return child.name.startsWith('@') ? child.name.split('/')[1] : child.name; // pure name
}
