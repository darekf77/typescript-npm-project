//#region @backend

import * as _ from 'lodash';
import * as fs from 'fs';
import * as fse from "fs-extra";
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';
import { watch } from 'chokidar'
import * as rimraf from 'rimraf';

import config from "../../config";
import { Project } from '../abstract';
import { FileEvent, IPackageJSON } from '../../models';
import { info, warn, log } from '../../helpers';
import { tryRemoveDir, tryCopyFrom } from '../../helpers';
import { GenerateProjectCopyOpt } from '../../models/index';
import { copyFile } from '../../helpers';
import { BuildOptions } from './build-options';
import { FeatureForProject } from '../abstract';

export class CopyManager extends FeatureForProject {

  private buildOptions: BuildOptions;

  public initCopyingOnBuildFinish(buildOptions: BuildOptions) {
    // console.log("INIT BUILD FINSH")
    this.buildOptions = buildOptions;
    const { watch } = buildOptions;
    if (!Array.isArray(this.buildOptions.copyto) || this.buildOptions.copyto.length === 0) {
      info(`No need to copying on build finsh... `)
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

  private executeCopy(sourceLocation: string, destinationLocation: string, options: GenerateProjectCopyOpt) {
    const { useTempLocation, filterForBundle, ommitSourceCode, override } = options;
    let tempDestination: string;
    if (useTempLocation) {
      tempDestination = `/tmp/${_.camelCase(destinationLocation)}`;
      if (fs.existsSync(tempDestination)) {
        rimraf.sync(tempDestination)
      }
      fse.mkdirpSync(tempDestination);
    } else {
      tempDestination = destinationLocation;
    }
    const copyOpt = {
      overwrite: true,
      recursive: true,
    };

    const sourceFolders = [
      config.folder.src,
      config.folder.components,
      config.folder.custom,
    ];

    const foldersToSkip = [
      ...(filterForBundle ? [
        '.vscode',
        ..._.values(config.tempFolders)
      ] : []),
      ...((filterForBundle && ommitSourceCode) ? sourceFolders : []),
      ...(this.project.isWorkspace ? this.project.children.map(c => c.name) : [])
    ];

    // console.log(foldersToSkip)

    const filter = override ? this.filterOnlyCopy(sourceFolders) : this.filterDontCopy(foldersToSkip);
    copyOpt['filter'] = filter;

    fse.copySync(`${sourceLocation}/`, tempDestination, copyOpt);

    if (useTempLocation) {
      fse.copySync(`${tempDestination}/`, destinationLocation, {
        overwrite: true,
        recursive: true,
      });
      rimraf.sync(tempDestination);
    }

    if (this.project.isForRecreation) {
      // console.log(`For project: ${this.project.genericName} files:
      // ${this.project.projectSourceFiles()}
      // `)
      this.project.projectSourceFiles().forEach(f => {
        const source = path.join(this.project.location, f);
        if (fse.existsSync(source)) {
          log(`Copying env file to static build: ${path.basename(f)} `)
          tryCopyFrom(source, path.join(destinationLocation, f));
        } else {
          warn(`[executeCopy] Doesn not exist source: ${source}`);
        }
      });
    }

  }

  public generateSourceCopyIn(destinationLocation: string,
    options?: GenerateProjectCopyOpt): boolean {
    // if (this.project.isWorkspace) {
    //   console.log('GENERATING WORKSPACE')
    // }

    if (_.isUndefined(options)) {
      options = {} as any;
    }

    if (_.isUndefined(options.filterForBundle)) {
      options.filterForBundle = true;
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

    const { override, showInfo } = options;

    const sourceLocation = this.project.location;
    if (this.project.isForRecreation) {
      var packageJson: IPackageJSON = fse.readJsonSync(path.join(sourceLocation, config.file.package_json), {
        encoding: 'utf8'
      });
      if (this.project.isWorkspace) {
        packageJson.tnp.isGenerated = true;
      }
    }

    if (fse.existsSync(destinationLocation)) {
      if (override) {
        tryRemoveDir(destinationLocation);
        fse.mkdirpSync(destinationLocation);
      } else {
        if (showInfo) {
          warn(`Destination for project "${this.project.name}" already exists, only: source copy`);
        };
      }
    }

    this.executeCopy(sourceLocation, destinationLocation, options);

    if (this.project.isForRecreation) {
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
      fse.writeFileSync(path.resolve(path.join(destinationLocation, '../info.txt')), `
      This workspace is generated.
    `);
    }

    if (showInfo) {
      let dir = path.basename(path.dirname(destinationLocation));
      if (fse.existsSync(path.dirname(path.dirname(destinationLocation)))) {
        dir = `${path.basename(path.dirname(path.dirname(destinationLocation)))}/${dir}`
      }
      info(`Source of project "${this.project.genericName})" generated in ${dir}/(< here >) `)
    }


    if (options.regenerateProjectChilds && this.project.isForRecreation) {
      let childs = this.project.children;

      if (this.project.isCoreProject && this.project.isContainer) {
        childs = this.project.children.filter(c => c.name === 'workspace');
      }

      if (this.project.isCoreProject && this.project.isWorkspace) {
        childs = this.project.children.filter(c => config.libsTypes.includes(c.name as any));
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

    const { specyficFileRelativePath = void 0, outDir = 'dist' } = options;

    if (!specyficFileRelativePath && (!destination || !destination.location)) {
      warn(`Invalid project: ${destination.name}`)
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

      copyFile(sourceFile, destinationFile)
    } else {
      const projectOudDirDest = path.join(destination.location,
        config.folder.node_modules,
        namePackageName
      );

      if (!dontRemoveDestFolder) {
        tryRemoveDir(projectOudDirDest, true)
      }

      if (this.project.isTnp) {
        // console.info('[copyto] TNP INTSTALL')
        destination.tnpBundle.installAsPackage()
      } else {
        // console.info('[copyto] NORMAL INTSTALL')
        const monitoredOutDir: string = path.join(this.project.location, outDir)

        tryCopyFrom(monitoredOutDir, projectOudDirDest)
      }
    }

  }

  // private __firstTimeWatchCopyTOFiles = [];
  private copyToProjectsOnFinish(event?: FileEvent, specyficFileRelativePath?: string, dontRemoveDestFolder = false) {
    // console.log(`[copyto] File cahnge: ${specyficFileRelativePath}, event: ${event}`)
    // prevent first unnecesary copy after watch
    // if (event && specificFile && !this.__firstTimeWatchCopyTOFiles.includes(specificFile)) {
    //   this.__firstTimeWatchCopyTOFiles.push(specificFile)
    //   return;
    // }

    const outDir = this.buildOptions.outDir;
    if (Array.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0) {
      (this.buildOptions.copyto as Project[]).forEach(p => {
        // console.log(`Copy to ${p.name}`)
        this.copyBuildedDistributionTo(p, { specyficFileRelativePath: event && specyficFileRelativePath, outDir }, dontRemoveDestFolder)
      })
    }

  }

  private watchAndCopyToProjectOnFinish() {
    const monitorDir = path.join(this.project.location, this.buildOptions.outDir);

    // console.log('watching   folder for as copy source !! ', monitorDir)

    if (fs.existsSync(monitorDir)) {
      watch(monitorDir, {
        followSymlinks: false,
        interval: process.platform === 'darwin' ? void 0 : 500,
        binaryInterval: process.platform === 'darwin' ? void 0 : 500,
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
