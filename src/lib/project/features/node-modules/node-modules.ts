//#region imports
import { path, crossPlatformPath, fse } from 'tnp-core/src';
import { _ } from 'tnp-core/src';
import { config } from 'tnp-config/src';
import { BaseFeatureForProject, Helpers } from 'tnp-helpers/src';
import { Project } from '../../abstract/project';
import { $Global } from '../../cli/cli-_GLOBAL_.backend';
//#region @backend
import { dedupePackages } from './node-modules-helpers.backend';
import { PackagesRecognition } from '../package-recognition/packages-recognition';
//#endregion
//#endregion

export class NodeModules extends BaseFeatureForProject<Project> {
  async linkFromCoreContainer(): Promise<void> {
    //#region @backendFunc
    const coreContainer = Project.by(
      'container',
      this.project.__frameworkVersion,
    );
    if (this.project.location === coreContainer.location) {
      Helpers.logInfo(
        `Reinstalling node_modules for core container ${coreContainer.name}`,
      );
      await coreContainer.__node_modules.reinstallIfNeeded();
      return;
    }
    // console.log(
    //   `Linking from core container ${coreContainer.name} ${this.project.genericName}`,
    // );
    await coreContainer.__node_modules.reinstallIfNeeded();

    //#region respect other proper core container linked node_modules
    if (
      config.frameworkNames.productionFrameworkName.includes(
        config.frameworkName,
      )
    ) {
      try {
        const realpathCCfromCurrentProj = fse.realpathSync(
          this.project.__node_modules.path,
        );
        const pathCCfromCurrentProj = crossPlatformPath(
          path.dirname(realpathCCfromCurrentProj),
        );

        const coreContainerFromNodeModules = this.project.ins.From(
          pathCCfromCurrentProj,
        );

        const isCoreContainer =
          coreContainerFromNodeModules?.__isCoreProject &&
          coreContainerFromNodeModules?.__isContainer &&
          coreContainerFromNodeModules.__frameworkVersionEquals(
            this.project.__frameworkVersion,
          );

        // console.log({
        //   realpathCCfromCurrentProj,
        //   pathCCfromCurrentProj,
        //   isCoreContainer,
        // });

        if (isCoreContainer) {
          return;
        }
      } catch (error) {}
    }
    //#endregion

    try {
      fse.unlinkSync(this.project.__node_modules.path);
    } catch (error) {
      Helpers.remove(this.project.__node_modules.path);
    }
    Helpers.createSymLink(
      coreContainer.__node_modules.path,
      this.project.__node_modules.path,
    );
    // Helpers.taskDone(
    //   `Linking from core container ${coreContainer.name} ${this.project.genericName}`,
    // );
    //#endregion
  }

  // // if problem with linking whole node_modules folder
  // private linkLinks() {
  // Helpers.remove(this.project.__node_modules.path);
  // Helpers.mkdirp(this.project.__node_modules.path);
  // for (const folderAbsPath of Helpers.foldersFrom(
  //   coreContainer.__node_modules.path,
  // )) {
  //   if (path.basename(folderAbsPath) === '.bin') {
  //     Helpers.copy(
  //       folderAbsPath,
  //       this.project.__node_modules.pathFor('.bin'),
  //     );
  //   } else {
  //     Helpers.createSymLink(
  //       folderAbsPath,
  //       this.project.__node_modules.pathFor(path.basename(folderAbsPath)),
  //     );
  //   }
  // }
  // }

  async reinstallIfNeeded(): Promise<void> {
    //#region @backend
    if (this.notExist) {
      await this.project.__npmPackages.installProcess(
        `[reinstallIfNeeded] Reinstalling node_modules`,
      );
    }
    //#endregion
  }

  get notExist(): boolean {
    return !this.exist;
  }

  get shouldDedupePackages() {
    return (
      !this.project.__npmPackages.useLinkAsNodeModules &&
      !this.project.__node_modules.isLink
    );
  }

  async updateFromReleaseDist(sourceOfCompiledProject: Project) {
    //#region @backendFunc

    //#region source folder
    const sourcePathToLocalProj = sourceOfCompiledProject.__isStandaloneProject
      ? crossPlatformPath([
          sourceOfCompiledProject.location,
          config.folder.tmpDistRelease,
          config.folder.dist,
          'project',
          sourceOfCompiledProject.name,
          `tmp-local-copyto-proj-${config.folder.dist}/${config.folder.node_modules}/${sourceOfCompiledProject.name}`,
        ])
      : crossPlatformPath([
          sourceOfCompiledProject.location,
          config.folder.tmpDistRelease,
          config.folder.dist,
          'project',
          sourceOfCompiledProject.name,
          config.folder.dist,
          sourceOfCompiledProject.name,
          sourceOfCompiledProject.__smartContainerBuildTarget.name,
          `tmp-local-copyto-proj-${config.folder.dist}/${config.folder.node_modules}/@${sourceOfCompiledProject.name}`,
        ]);
    //#endregion

    //#region copy process
    const destBasePath = crossPlatformPath([
      this.project.__node_modules.path,
      sourceOfCompiledProject.name,
    ]);
    for (const fileOrFolder of sourceOfCompiledProject.compiledProjectFilesAndFolders) {
      const dest = crossPlatformPath([destBasePath, fileOrFolder]);
      const source = crossPlatformPath([sourcePathToLocalProj, fileOrFolder]);

      if (Helpers.exists(source)) {
        // Helpers.info(`Release update copying
        // EXISTS ${Helpers.exists(source)}
        // ${source}
        //  to
        // ${dest}`);
        if (Helpers.isFolder(source)) {
          Helpers.copy(source, dest, { overwrite: true, recursive: true });
        } else {
          Helpers.copyFile(source, dest);
        }
      }
    }
    //#endregion

    await PackagesRecognition.startFor(
      sourceOfCompiledProject,
      'after release update',
    );

    //#endregion
  }

  setToSmartContainer() {
    //#region @backendFunc
    this.project.__packageJson.data.tnp.type = 'container';
    this.project.__packageJson.data.tnp.smart = true;
    this.project.__packageJson.save('setting container as smart');
    //#endregion
  }

  get path(): string {
    //#region @backendFunc
    return crossPlatformPath(
      path.join(this.project.location, config.folder.node_modules),
    );
    //#endregion
  }
  pathFor(packageName: string): string {
    //#region @backendFunc
    return crossPlatformPath([fse.realpathSync(this.path), packageName]);
    //#endregion
  }

  /**
   * @deprecated
   */
  get exist(): boolean {
    //#region @backendFunc
    const project = this.project;
    if (project.__isStandaloneProject) {
      const nodeModulesPath = path.join(
        project.location,
        config.folder.node_modules,
      );

      const pathBin = path.join(nodeModulesPath, config.folder._bin);
      const dummyPackages = [].length + 1;
      const fullOfPackages = this.nodeMOdulesOK(nodeModulesPath, dummyPackages);
      const res = Helpers.exists(pathBin) && fullOfPackages;
      return res;
    }
    const p = path.join(project.location, config.folder.node_modules);
    return fse.existsSync(p);
    //#endregion
  }

  private nodeMOdulesOK(pathToFolder: string | string[], moreThan = 1) {
    if (_.isArray(pathToFolder)) {
      pathToFolder = path.join(...pathToFolder) as string;
    }
    let res = false;
    Helpers.log(`[node-modules] checking if exists in: ${pathToFolder}`, 1);
    if (Helpers.exists(pathToFolder)) {
      const count = {
        unknowFilesOrUnexitedLInks: 0,
        folders: 0,
        links: 0,
      };
      res = !_.isUndefined(
        fse
          .readdirSync(pathToFolder)
          .map(f => path.join(pathToFolder as string, f))
          .find(f => {
            if (count.unknowFilesOrUnexitedLInks > moreThan) {
              return true;
            }
            if (count.folders > moreThan) {
              return true;
            }
            if (count.links > moreThan) {
              return true;
            }
            if (Helpers.isExistedSymlink(f)) {
              count.links++;
            } else if (Helpers.isFolder(f)) {
              count.folders++;
            } else {
              count.unknowFilesOrUnexitedLInks++;
            }
            return false;
          }),
      );
    }
    Helpers.log(`[node-modules] checking done: ${res}`);
    return res;
  }

  get isLink(): boolean {
    return Helpers.isSymlinkFileExitedOrUnexisted(this.path);
  }
  dedupe(
    packagesOrOptions?: string[] | { packages?: string[]; reason: string },
  ): void {
    const packages = _.isArray(packagesOrOptions)
      ? packagesOrOptions
      : packagesOrOptions?.packages;
    if (!_.isArray(packagesOrOptions) && packagesOrOptions?.reason) {
      Helpers.logInfo(`Reason to dedupe: ${packagesOrOptions?.reason}`);
    }
    const tnpProj = Project.ins.Tnp;
    const arrTrusted =
      tnpProj.__packageJson.data.tnp.core.dependencies.trusted[
        this.project.__frameworkVersion
      ];
    const arrAddTrusted =
      tnpProj.__packageJson.data.tnp.core.dependencies['additionalTrusted'] ||
      {};
    const packagesNames =
      _.isArray(packages) && packages.length > 0
        ? packages
        : Helpers.arrays.uniqArray([
            ...tnpProj.__packageJson.data.tnp.core.dependencies.dedupe,
            ...arrTrusted,
            ...arrAddTrusted,
          ]);

    dedupePackages(
      this.project.location,
      packagesNames,
      false,
      !this.project.__npmPackages.useLinkAsNodeModules,
    );
    // }
  }

  dedupeCount(packages?: string[]): void {
    dedupePackages(
      this.project.location,
      Array.isArray(packages) ? packages : [],
      true,
      !this.project.__npmPackages.useLinkAsNodeModules,
    );
  }

  remove(packageInside?: string): void {
    Helpers.log(`Removing node_modules from ${this.project?.name}`);
    if (packageInside) {
      Helpers.removeIfExists(path.join(this.path, packageInside));
      return;
    }
    Helpers.remove(this.path, true);
  }

  linkTo(targetProjectOrPath: Project | string): void {
    let pathDestNodeModules = crossPlatformPath(
      _.isString(targetProjectOrPath)
        ? targetProjectOrPath
        : targetProjectOrPath.location,
    );
    if (!path.isAbsolute(pathDestNodeModules)) {
      Helpers.error(
        `[linkTo] taget path is not absolute "${pathDestNodeModules}"`,
      );
    }
    if (!pathDestNodeModules.endsWith('/' + config.folder.node_modules)) {
      pathDestNodeModules = crossPlatformPath([
        pathDestNodeModules,
        config.folder.node_modules,
      ]);
    }

    Helpers.remove(pathDestNodeModules, true);
    if (Helpers.isUnexistedLink(this.path)) {
      try {
        fse.unlinkSync(this.path);
      } catch (error) {}
    }
    Helpers.createSymLink(this.path, pathDestNodeModules, {
      continueWhenExistedFolderDoesntExists: true,
    });
  }

  /**
   * Just create folder... without npm instalation
   */
  recreateFolder(): void {
    if (!fse.existsSync(this.path)) {
      Helpers.mkdirp(this.path);
    }
  }
}
