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
import { tryRemoveDir, tryCopyFrom } from '../../index';
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
      this.copyToProjectsOnFinish();
      this.watchAndCopyToProjectOnFinish();
    } else {
      this.copyToProjectsOnFinish();
    }
  }

  genWorkspaceEnvFiles(destination: Project) {
    const site = `${this.project.isSite ? `${config.folder.custom}/` : ''}`;
    glob
      .sync(`${this.project.location}/${site}${config.file.environment}*`)
      .forEach(envFile => {
        log(`Copying env file to static build: ${path.basename(envFile)} `)
        tryCopyFrom(envFile, path.join(this.project.location, config.folder.dist, this.project.name, site, path.basename(envFile)))
      })
  }

  public generateSourceCopyIn(destinationLocation: string,
    options?: {
      override?: boolean;
      filterForBundle?: boolean;
      showInfo?: boolean;
      ommitSourceCode?: boolean;
    }): boolean {

    const { override = true, filterForBundle = true, showInfo = true, ommitSourceCode = false } = options || {}
    if (_.isUndefined(filterForBundle)) {
      options.filterForBundle = true;
    }
    if (_.isUndefined(override)) {
      options.override = true;
    }
    if (_.isUndefined(showInfo)) {
      options.showInfo = true;
    }
    const sourceLocation = this.project.location;
    if (this.project.isWorkspace) {
      var packageJson: IPackageJSON = fse.readJsonSync(path.join(sourceLocation, config.file.package_json), {
        encoding: 'utf8'
      });
      packageJson.tnp.isGenerated = true;
    }


    if (fs.existsSync(destinationLocation) && !override) {
      showInfo && warn(`Destination for project "${this.project.name}" already exists in ${destinationLocation}`)
      return false;
    } else {
      if (fse.existsSync(destinationLocation) && override) {
        tryRemoveDir(destinationLocation);
      }
      fse.mkdirpSync(destinationLocation);
    }

    // const tempLocation = `/tmp/${_.camelCase(destinationLocation)}`;
    // if (fs.existsSync(tempLocation)) {
    //   rimraf.sync(tempLocation)
    // }
    // fse.mkdirpSync(tempLocation);

    if (filterForBundle) {


      const foldersToSkip = [
        '.vscode',
        ..._.values(config.tempFolders),
        ...(ommitSourceCode ? [
          config.folder.src,
          config.folder.components,
          config.folder.custom,
        ] : [])
      ];

      fse.copySync(`${sourceLocation}/`, destinationLocation, {
        filter: (src: string, dest: string) => {
          const baseFolder = _.first(src.replace(this.project.location, '')
            .replace(/^\//, '').split('/'));
          const res = _.isUndefined(foldersToSkip.find(f => baseFolder.startsWith(f)));
          // console.log(`start: ${baseFolder}
          // => src: ${src}
          // -> dest ${dest}
          // = ${res}`)
          return res;
        }
      });
    } else {
      fse.copySync(`${sourceLocation}/`, destinationLocation);
    }



    // fse.copySync(`${tempLocation}/`, destinationLocation, {
    //   overwrite: true,
    //   recursive: true
    // });
    // rimraf.sync(tempLocation)

    if (this.project.isWorkspace) {
      fse.writeJsonSync(path.join(destinationLocation, config.file.package_json), packageJson, {
        spaces: 2,
        encoding: 'utf8'
      });
      fse.writeFileSync(path.resolve(path.join(destinationLocation, '../info.txt')), `
        This workspace is generated.
      `)
    }

    if (showInfo) {
      let dir = path.basename(path.dirname(destinationLocation));
      if (fse.existsSync(path.dirname(path.dirname(destinationLocation)))) {
        dir = `${path.basename(path.dirname(path.dirname(destinationLocation)))}/${dir}`
      }
      info(`Source of project "${this.project.genericName})" generated in ${dir}/(< here >) `)
    }

    return true;
  }


  public copyBuildedDistributionTo(destination: Project,
    options?: { specyficFileRelativePath?: string, outDir?: 'dist' | 'bundle' }) {

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

      tryRemoveDir(projectOudDirDest, true)

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
  private copyToProjectsOnFinish(event?: FileEvent, specyficFileRelativePath?: string) {
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
        this.copyBuildedDistributionTo(p, { specyficFileRelativePath: event && specyficFileRelativePath, outDir })
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
