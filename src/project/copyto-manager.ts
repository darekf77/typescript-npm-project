//#region @backend

import * as _ from 'lodash';
import * as fs from 'fs';
import * as fse from "fs-extra";
import * as path from 'path';
import chalk from 'chalk';
// import * as watch from 'watch'
import { watch } from 'chokidar'
import * as rimraf from 'rimraf';

import config from "../config";
import { Project } from './base-project';
import { FileEvent, BuildOptions, IPackageJSON } from '../models';
import { info, warn } from '../messages';
import { tryRemoveDir, tryCopyFrom } from '../index';
import { copyFile } from '../helpers';

export class CopyToManager {

  constructor(private project: Project) { }

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
      this.copyToProjectsOnFinish()
      this.watchAndCopyToProjectOnFinish()
    } else {
      this.copyToProjectsOnFinish()
    }
  }

  public generateSourceCopyIn(destinationLocation: string) {

    const sourceLocation = this.project.location;
    if (this.project.isWorkspace) {
      var packageJson: IPackageJSON = fse.readJsonSync(path.join(sourceLocation, config.file.package_json), {
        encoding: 'utf8'
      });
      packageJson.tnp.isGenerated = true;
    }


    if (!fs.existsSync(destinationLocation)) {
      fse.mkdirpSync(destinationLocation);
    }

    const tempLocation = `/tmp/${_.camelCase(destinationLocation)}`;
    if (fs.existsSync(tempLocation)) {
      rimraf.sync(tempLocation)
    }
    fse.mkdirpSync(tempLocation);

    fse.copySync(`${sourceLocation}/`, tempLocation, {
      filter: (src: string, dest: string) => {
        // console.log('src', src)
        // return
        // !src.endsWith('/dist/bin') &&
        //   !src.endsWith('/bin') &&
        return !/.*node_modules.*/g.test(src) &&
          !/.*tmp\-.*/g.test(src) &&
          !/.*dist.*/g.test(src) &&
          !/.*\.vscode.*/g.test(src) &&
          !/.*bundle.*/g.test(src);
      }
    });

    fse.copySync(`${tempLocation}/`, destinationLocation, {
      overwrite: true,
      recursive: true
    });
    rimraf.sync(tempLocation)

    if (this.project.isWorkspace) {
      fse.writeJsonSync(path.join(destinationLocation, config.file.package_json), packageJson, {
        spaces: 2,
        encoding: 'utf8'
      });
      fse.writeFileSync(path.resolve(path.join(destinationLocation, '../info.txt')), `
        This workspace is generated.
      `)
    }

  }


  public copyBuildedDistributionTo(destination: Project, options?: { specyficFileRelativePath?: string, outDir?: 'dist' | 'bundle' }) {
    const { specyficFileRelativePath = undefined, outDir = 'dist' } = options;

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
        destination.tnpHelper.install()
      }
      else {
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
      this.buildOptions.copyto.forEach(p => {
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
