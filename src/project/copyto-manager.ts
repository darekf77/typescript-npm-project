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

export class CopyToManager {

  constructor(private project: Project) { }

  private buildOptions: BuildOptions;

  public initCopyingOnBuildFinish(buildOptions: BuildOptions) {
    this.buildOptions = buildOptions;
    const { watch } = buildOptions;
    if (!Array.isArray(this.buildOptions.copyto) || this.buildOptions.copyto.length === 0) {
      // info(`No need to copying on build finsh`)
      return;
    }
    if (watch) {
      this.watchOutDir()
    } else {
      this.copyToProjectsOnFinish()
    }
  }

  public generateCopyIn(destinationLocation) {

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
        // return
        // !src.endsWith('/dist/bin') &&
        //   !src.endsWith('/bin') &&
        return !/.*node_modules.*/g.test(src) &&
          !/.*tmp\-.*/g.test(src) &&
          !/.*dist\-.*/g.test(src) &&
          !/.*\.vscode\-.*/g.test(src) &&
          !/.*bundle\-.*/g.test(src);
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

  public copyToProjectNodeModules(destination: Project) {

    if (this.project.isTnp) {
      destination.tnpHelper.install();
      return;
    }

    const monitoredOutDir: string = path.join(this.project.location,
      config.folder.dist)

    const projectOudDirDest = path.join(destination.location,
      config.folder.node_modules,
      this.project.name);
    fse.copySync(monitoredOutDir, projectOudDirDest, { overwrite: true });
  }

  private __firstTimeWatchCopyTOFiles = [];
  private copyToProjectsOnFinish(event?: FileEvent, specificFile?: string) {

    // prevent first unnecesary copy after watch
    if (event && specificFile && !this.__firstTimeWatchCopyTOFiles.includes(specificFile)) {
      this.__firstTimeWatchCopyTOFiles.push(specificFile)
      return;
    }

    const monitoredOutDir: string = this.buildOptions.outDir;
    if (Array.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0) {
      // console.log(`copyto ${monitoredOutDir}`, this.buildOptions.copyto )


      if (event && specificFile) {
        // console.log(`Event: ${event} Copy SPECIFI FILE: ${specificFile}`)
        const monitoredSpecificFile = path.normalize(path.join(this.project.location,
          this.buildOptions.outDir, specificFile));

        this.buildOptions.copyto.forEach(p => {
          if (p && p.location) {

            const projectOudFileDest = path.normalize(path.join(p.location,
              config.folder.node_modules,
              this.project.isTnp ? config.file.tnpBundle : this.project.name,
              specificFile));
            // console.log(`Copy file !: ${monitoredSpecificFile} to ${projectOudFileDest} `)
            fse.copySync(monitoredSpecificFile, projectOudFileDest);

          } else {
            warn(`Invalid project: ${p}`)
          }

        })

      } else {
        this.buildOptions.copyto.forEach(p => {

          if (p && p.location) {
            if (this.project.isTnp) {
              p.tnpHelper.install(true);
            } else {
              const projectOudDirDest = path.join(p.location,
                config.folder.node_modules,
                this.project.isTnp ? config.file.tnpBundle : this.project.name
              );
              fse.copySync(monitoredOutDir, projectOudDirDest, { overwrite: true });
            }
          } else {
            warn(`Invalid project: ${p}`)
          }

        })
      }
    }
  }

  private watchOutDir() {
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

      // console.log(`Monitoring directory: ${monitorDir} `)
      // watch.watchTree(monitorDir, (f, curr, prev) => {

      //     if (_.isString(f)) {
      //         f = f.replace(monitorDir, '') as any
      //         // console.log(f)
      //     }

      //     // process.exit(0)
      //     if (typeof f == "object" && prev === null && curr === null) {
      //         // Finished walking the tree
      //     } else if (prev === null) {
      //         this.copyToProjectsOnFinish('created', f as any);
      //     } else if (curr.nlink === 0) {
      //         this.copyToProjectsOnFinish('removed', f as any);
      //     } else {
      //         this.copyToProjectsOnFinish('changed', f as any);
      //         // f was changed
      //     }
      // })
    } else {
      console.log(`Waiting for outdir: ${this.buildOptions.outDir}, monitor Dir: ${monitorDir}`);
      setTimeout(() => {
        this.watchOutDir();
      }, 1000)
    }
  }


}
//#endregion
