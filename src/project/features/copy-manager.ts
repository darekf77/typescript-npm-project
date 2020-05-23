//#region @backend

import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';
import * as os from 'os';
import { watch } from 'chokidar'

import { config } from '../../config';
import { Project } from '../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';;
import { BuildOptions } from 'tnp-db';
import { FeatureForProject } from '../abstract';

export class CopyManager extends FeatureForProject {

  private buildOptions: BuildOptions;

  public initCopyingOnBuildFinish(buildOptions: BuildOptions) {
    // console.log("INIT BUILD FINSH")
    this.buildOptions = buildOptions;
    const { watch } = buildOptions;
    if (!Array.isArray(this.buildOptions.copyto) || this.buildOptions.copyto.length === 0) {
      Helpers.info(`No need to copying on build finsh... `)
      return;
    }
    if (watch) {
      this.copyToProjectsOnFinish(void 0, void 0, watch);
      this.watchAndCopyToProjectOnFinish();
    } else {
      this.copyToProjectsOnFinish();
    }
  }

  private filterDontCopy(basePathFoldersTosSkip: string[]) {

    return (src: string, dest: string) => {
      // console.log('src',src)
      const baseFolder = _.first(src.replace(this.project.location, '')
        .replace(/^\//, '').split('/'));
      if (!baseFolder || baseFolder.trim() === '') {
        return true;
      }
      const isAllowed = _.isUndefined(basePathFoldersTosSkip.find(f => baseFolder.startsWith(f)));
      return isAllowed;
    };

  }

  private filterOnlyCopy(basePathFoldersOnlyToInclude: string[]) {

    return (src: string, dest: string) => {
      const baseFolder = _.first(src.replace(this.project.location, '')
        .replace(/^\//, '').split('/'));
      if (!baseFolder || baseFolder.trim() === '') {
        return true;
      }
      const isAllowed = !_.isUndefined(basePathFoldersOnlyToInclude.find(f => baseFolder.startsWith(f)));
      return isAllowed;
    };

  }

  // genSourceFilesInside(destination: Project) {
  //   this.project.projectSourceFiles()
  //     .forEach(f => {
  //       const source = path.join(this.project.location, f);
  //       log(`Copying env file to static build: ${path.basename(f)} `)
  //       tryCopyFrom(source, path.join(destination.location, f));
  //     });
  // }

  private executeCopy(sourceLocation: string, destinationLocation: string, options: Models.other.GenerateProjectCopyOpt) {
    const { useTempLocation, filterForBundle, ommitSourceCode, override } = options;
    let tempDestination: string;
    // console.log('useTempLocation',useTempLocation)
    if (useTempLocation) {
      tempDestination = `${os.platform() === 'darwin' ? '/private/tmp' : '/tmp'}/${_.camelCase(destinationLocation)}`;
      if (fse.existsSync(tempDestination)) {
        Helpers.remove(tempDestination);
      }

      Helpers.mkdirp(tempDestination);
      // console.log(`tempDestination: "${tempDestination}"`);
      // process.exit(0)
    } else {
      tempDestination = destinationLocation;
    }

    const sourceFolders = [
      config.folder.src,
      config.folder.components,
      config.folder.custom,
    ];

    const foldersToSkip = [
      ...(filterForBundle ? [
        '.vscode',
        ..._.values(config.tempFolders),
      ] : []),
      ...(this.project.projectLinkedFiles().map(c => c.relativePath)),
      ...((filterForBundle && ommitSourceCode) ? sourceFolders : []),
      ...(this.project.isWorkspace ? this.project.children.map(c => c.name) : [])
    ];

    // console.log(foldersToSkip)

    const filter = override ? this.filterOnlyCopy(sourceFolders) : this.filterDontCopy(foldersToSkip);

    Helpers.copy(`${sourceLocation}/`, tempDestination, { filter });

    if (useTempLocation) {
      Helpers.copy(`${tempDestination}/`, destinationLocation);
      Helpers.remove(tempDestination);
    }

    if (this.project.isContainerWorkspaceRelated) {
      // console.log(`For project: ${this.project.genericName} files:
      // ${this.project.projectSourceFiles()}
      // `)
      this.project.projectSourceFiles().forEach(f => {
        const source = path.join(this.project.location, f);
        if (fse.existsSync(source)) {
          Helpers.log(`Copying file/folder to static build: ${f} `)
          if (fse.lstatSync(source).isDirectory()) {
            Helpers.tryCopyFrom(source, path.join(destinationLocation, f));
          } else {
            Helpers.copyFile(source, path.join(destinationLocation, f));
          }
        } else {
          Helpers.log(`[executeCopy] Doesn not exist source: ${source}`);
        }
      });
    }

  }

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
    if (this.project.isContainerWorkspaceRelated || options.forceCopyPackageJSON) {
      var packageJson: Models.npm.IPackageJSON = fse.readJsonSync(path.join(sourceLocation, config.file.package_json), {
        encoding: 'utf8'
      });
      if (this.project.isWorkspace && markAsGenerated) {
        packageJson.tnp.isGenerated = true;
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

    this.executeCopy(sourceLocation, destinationLocation, options);

    if (this.project.isContainerWorkspaceRelated || options.forceCopyPackageJSON) {
      const packageJsonLocation = path.join(destinationLocation, config.file.package_json);
      // console.log(`packageJsonLocation: ${packageJsonLocation}`)
      // console.log('packageJson', packageJson)
      fse.writeJsonSync(packageJsonLocation, packageJson, {
        spaces: 2,
        encoding: 'utf8'
      });
      // console.log(`packageJsonLocation saved: ${packageJsonLocation}`)
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
      Helpers.info(`Source of project "${this.project.genericName})" generated in ${dir}/(< here >) `)
    }


    if (options.regenerateProjectChilds && this.project.isContainerWorkspaceRelated) {
      let childs = this.project.children;

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


  public copyBuildedDistributionTo(destination: Project,
    options: { specyficFileRelativePath?: string, outDir?: 'dist' | 'bundle' }, dontRemoveDestFolder: boolean) {

    const { specyficFileRelativePath = void 0, outDir = 'dist' } = options || {};

    if (!specyficFileRelativePath && (!destination || !destination.location)) {
      Helpers.warn(`Invalid project: ${destination.name}`)
      return
    }

    const namePackageName = this.project.isTnp ? config.file.tnpBundle : this.project.name;


    if (specyficFileRelativePath) {
      const sourceFile = path.normalize(path.join(this.project.location,
        outDir, specyficFileRelativePath));

      const destinationFile = path.normalize(path.join(destination.location,
        config.folder.node_modules,
        namePackageName,
        specyficFileRelativePath));

      Helpers.copyFile(sourceFile, destinationFile)
    } else {
      const projectOudDirDest = path.join(destination.location,
        config.folder.node_modules,
        namePackageName
      );

      if (!dontRemoveDestFolder) {
        Helpers.tryRemoveDir(projectOudDirDest, true)
      }

      if (this.project.isTnp) {
        // console.info('[copyto] TNP INTSTALL')
        destination.tnpBundle.installAsPackage()
      } else {
        // console.info('[copyto] NORMAL INTSTALL')
        const monitoredOutDir: string = path.join(this.project.location, outDir)

        Helpers.tryCopyFrom(monitoredOutDir, projectOudDirDest)
      }
    }

  }

  // private __firstTimeWatchCopyTOFiles = [];
  private copyToProjectsOnFinish(event?: Models.other.FileEvent,
    specyficFileRelativePath?: string, dontRemoveDestFolder = false) {
    // Helpers.log(`[copyto] File cahnge: ${specyficFileRelativePath}, event: ${event}`)
    // prevent first unnecesary copy after watch
    // if (event && specificFile && !this.__firstTimeWatchCopyTOFiles.includes(specificFile)) {
    //   this.__firstTimeWatchCopyTOFiles.push(specificFile)
    //   return;
    // }

    const outDir = this.buildOptions.outDir;
    if (Array.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0) {
      (this.buildOptions.copyto as any[]).forEach((p: Project) => {
        // Helpers.log(`Copy to ${p.name}`)
        this.copyBuildedDistributionTo(p, { specyficFileRelativePath: event && specyficFileRelativePath, outDir: outDir as any }, dontRemoveDestFolder)
      })
    }

  }

  private watchAndCopyToProjectOnFinish() {
    const monitorDir = path.join(this.project.location, this.buildOptions.outDir);

    // Helpers.log(`watching folder for as copy source !! ${monitorDir}`)

    if (fse.existsSync(monitorDir)) {
      watch(monitorDir, {
        followSymlinks: false
      }).on('change', (f) => {
        if (_.isString(f)) {
          f = f.replace(monitorDir, '') as any
          // console.log(f)
        }
        this.copyToProjectsOnFinish('changed', f as any);
      }).on('add', f => {
        if (_.isString(f)) {
          f = f.replace(monitorDir, '') as any
          // console.log(f)
        }
        this.copyToProjectsOnFinish('created', f as any);
      }).on('unlink', f => {
        if (_.isString(f)) {
          f = f.replace(monitorDir, '') as any
          // console.log(f)
        }
        this.copyToProjectsOnFinish('removed', f as any);
      })

    } else {
      console.log(`Waiting for outdir: ${this.buildOptions.outDir}, monitor Dir: ${monitorDir}`);
      setTimeout(() => {
        this.watchAndCopyToProjectOnFinish();
      }, 1000)
    }
  }


}
//#endregion
