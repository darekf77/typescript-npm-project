import * as _ from 'lodash';
import * as fs from 'fs';
import * as fse from "fs-extra";
import * as path from 'path';
import chalk from 'chalk';
import * as watch from 'watch'

// local
import { Project } from "./base-project";
import { BuildDir, LibType, FileEvent } from "../models";
import { questionYesNo, clearConsole } from "../process";
import { error, info, warn } from "../messages";
import config from "../config";
import { compilationWrapper } from '../helpers';
import { PackageJSON } from './package-json';

/**
 * Project ready to be build/publish as npm package.
 * Also ready to be linked as package in workspace.
 *  - isomorphic-lib
 *  - angular-lib
 */
export abstract class BaseProjectLib extends Project {

  projectSpecyficFiles() {
    const files = [
      'index.js',
      'index.d.ts',
      'index.js.map'
    ]
    return files;
  }


  abstract buildLib(outDir: BuildDir, prod?: boolean, watch?: boolean);

  public copyToProjectNodeModules(destination: Project) {
    const monitoredOutDir: string = path.join(this.location,
      config.folder.dist)

    const projectOudDirDest = path.join(destination.location,
      config.folder.node_modules,
      this.name);
    fse.copySync(monitoredOutDir, projectOudDirDest, { overwrite: true });
  }

  private __firstTimeWatchCopyTOFiles = [];
  public copyToProjectsOnFinish(event?: FileEvent, specificFile?: string) {

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
        const monitoredSpecificFile = path.normalize(path.join(this.location,
          this.buildOptions.outDir, specificFile));

        this.buildOptions.copyto.forEach(p => {
          const projectOudFileDest = path.normalize(path.join(p.location,
            config.folder.node_modules,
            this.name,
            specificFile));
          // console.log(`Copy file: ${monitoredSpecificFile} to ${projectOudFileDest} `)
          fse.copySync(monitoredSpecificFile, projectOudFileDest);
        })

      } else {
        this.buildOptions.copyto.forEach(p => {
          const projectOudDirDest = path.join(p.location,
            config.folder.node_modules,
            this.name);
          fse.copySync(monitoredOutDir, projectOudDirDest, { overwrite: true });
        })
      }
    }
  }

  protected watchOutDir() {
    const monitorDir = path.join(this.location, this.buildOptions.outDir);

    if (fs.existsSync(monitorDir)) {
      // console.log(`Monitoring directory: ${monitorDir} `)
      watch.watchTree(monitorDir, (f, curr, prev) => {

        if (_.isString(f)) {
          f = f.replace(monitorDir, '') as any
          // console.log(f)
        }

        // process.exit(0)
        if (typeof f == "object" && prev === null && curr === null) {
          // Finished walking the tree
        } else if (prev === null) {
          this.copyToProjectsOnFinish('created', f as any);
        } else if (curr.nlink === 0) {
          this.copyToProjectsOnFinish('removed', f as any);
        } else {
          this.copyToProjectsOnFinish('changed', f as any);
          // f was changed
        }
      })
    } else {
      console.log(`Waiting for outdir: ${this.buildOptions.outDir}`);
      setTimeout(() => {
        this.watchOutDir();
      }, 1000)
    }
  }

  public async publish() {
    this.checkIfReadyForNpm()
    await questionYesNo(`Publish on npm version: ${Project.Current.version} ?`, () => {
      this.run('npm publish', {
        cwd: path.join(this.location, config.folder.bundle),
        output: true
      }).sync()
      this.pushToGitRepo()
    })
  }

  public async release(c?: { prod?: boolean, bumbVersionIn?: string[] }) {
    const { prod = false, bumbVersionIn = [] } = c;
    clearConsole()
    this.checkIfReadyForNpm()
    const newVersion = Project.Current.versionPatchedPlusOne;
    const self = this;
    function removeTagAndCommit() {
      console.log(`PLEASE RUN: `)
      console.log(`git reset --hard`)
      console.log(`git tag --delete v${newVersion}`)
    }

    await questionYesNo(`Release new version: ${newVersion} ?`, async () => {
      try {
        this.run(`npm version patch`).sync()
      } catch (e) {
        error(`Please commit your changes before release.`)
      }
      this.run(`tnp clear`).sync();
      this.build({
        prod, outDir: config.folder.bundle as 'bundle', environmentName: 'local'
      })
      this.bundleResources()
    }, () => process.exit(0))
    await questionYesNo(`Publish on npm version: ${newVersion} ?`, () => {
      let successPublis = false;
      try {
        this.run('npm publish', {
          cwd: path.join(this.location, config.folder.bundle),
          output: true
        }).sync()
        successPublis = true;
      } catch (error) {
        removeTagAndCommit()
      }
      if (successPublis) {
        if (_.isArray(bumbVersionIn)) {
          bumbVersionIn.forEach(p => {
            const packageJson = PackageJSON.from(p, true);
            if (packageJson) {
              if (_.isString(packageJson.data.dependencies)) {
                packageJson.data.dependencies[this.name] = newVersion;
              }
              if (_.isString(packageJson.data.devDependencies)) {
                packageJson.data.devDependencies[this.name] = newVersion
              }
              packageJson.save()
            }
          });
        }
        this.pushToGitRepo()
      }
    }, () => {
      removeTagAndCommit()
    })
  }

  pushToGitRepo() {
    console.log('Pushing to git repository... ')
    const branchName = this.run('git symbolic-ref --short HEAD', { output: false }).sync().toString();
    console.log(`Git branch: ${branchName}`)
    this.run(`git push origin ${branchName}`, { output: false }).sync()
    info('Pushing to git repository done.')
  }

  public bundleResources() {
    this.checkIfReadyForNpm()
    const bundleFolder = path.join(this.location, config.folder.bundle);
    if (!fs.existsSync(bundleFolder)) fs.mkdirSync(bundleFolder);
    ['package.json'].concat(this.resources).forEach(res => {
      const file = path.join(this.location, res);
      const dest = path.join(bundleFolder, res);
      if (!fs.existsSync(file)) {
        error(`Resource file ${file} does not exist in ${this.location}`)
      }
      if (fs.lstatSync(file).isDirectory()) {
        // console.log('IS DIRECTORY', file)
        // console.log('IS DIRECTORY DEST', dest)
        // this.run(`tnp cpr ${file}/ ${dest}/`).sync()
        const options: fse.CopyOptionsSync = {
          overwrite: true,
          recursive: true,
          errorOnExist: true,
          filter: (src) => {
            return !/.*node_modules.*/g.test(src);
          }
        };
        fse.copySync(file, dest, options);
      } else {
        // console.log('IS FILE', file)
        fse.copyFileSync(file, dest);
      }
    })
    info(`Resources copied to release folder: ${config.folder.bundle}`)
  }



  protected compilationWrapper(fn: () => void, taskName: string = 'Task', executionType?: string) {
    return compilationWrapper(fn, taskName, executionType as any);
  }


}
