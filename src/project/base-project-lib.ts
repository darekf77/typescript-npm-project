//#region @backend
import * as _ from 'lodash';
import * as fs from 'fs';
import * as fse from "fs-extra";
import * as path from 'path';

// local
import { Project } from "./base-project";
import { BuildDir, LibType, FileEvent, ReleaseOptions } from "../models";
import { questionYesNo } from "../process";
import { error, info, warn } from "../messages";
import config from "../config";
import { PackageJSON } from './package-json';
import { install } from '../scripts/INSTALL';
import { ProjectFrom, tryCopyFrom } from '../index';

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


  abstract async buildLib(outDir: BuildDir, forClient: Project[], prod?: boolean, watch?: boolean);

  // abstract get isBuildedForOther();


  // public async publish() {
  //   this.checkIfReadyForNpm()
  //   await questionYesNo(`Publish on npm version: ${Project.Current.version} ?`, () => {
  //     this.run('npm publish', {
  //       cwd: path.join(this.location, config.folder.bundle),
  //       output: true
  //     }).sync()
  //     this.pushToGitRepo()
  //   })
  // }

  checkIfLogginInToNpm() {
    try {
      this.run('npm whoami').sync();
    } catch (e) {
      error(`Please login in to npm.`, false, true)
    }
  }

  /**
   * Return how many projects has changed
   * @param bumbVersionIn
   * @param newVersion
   * @param onlyInThisProjectSubprojects
   */
  bumpVersionInOtherProjects(bumbVersionIn: string[], newVersion, onlyInThisProjectSubprojects = false): Number {
    let count = 0;
    if (_.isArray(bumbVersionIn)) {
      const currentProjectLocation = path.resolve(this.location);
      bumbVersionIn = bumbVersionIn
        .map(p => path.resolve(p))
        .filter(p => p !== currentProjectLocation);

      if (onlyInThisProjectSubprojects) {
        bumbVersionIn = bumbVersionIn.filter(p => p.startsWith(currentProjectLocation));
      } else {
        bumbVersionIn = bumbVersionIn.filter(p => !p.startsWith(currentProjectLocation));
      }

      bumbVersionIn.forEach(p => {
        const packageJson = PackageJSON.fromLocation(p);
        if (packageJson.data.tnp && packageJson.data.tnp.type) {
          const project = ProjectFrom(p);
          if (project.isWorkspace && project.isCoreProject) {
            if (!project.packageJson.data.dependencies) {
              project.packageJson.data.dependencies = {};
            }
            project.packageJson.data.dependencies[this.name] = newVersion;
            project.packageJson.save()
            project.packageJson.coreRecreate();
            info(`Version of current project "${this.name}" bumped in ${project.name} (with recreate) `)
            count++;
          }
          return
        }

        if (packageJson && packageJson.data) {
          let versionBumped = false;
          if (packageJson.data.dependencies && packageJson.data.dependencies[this.name]) {
            versionBumped = true;
            packageJson.data.dependencies[this.name] = newVersion;
          }
          if (packageJson.data.devDependencies && packageJson.data.devDependencies[this.name]) {
            versionBumped = true;
            packageJson.data.devDependencies[this.name] = newVersion
          }
          if (versionBumped) {
            packageJson.save()
            info(`Version of current project "${this.name}" bumped in ${packageJson.name}`)
            count++;
          }
        }
      });
    }
    return count;
  }

  private commit(newVer) {
    try {
      this.run(`git add --all . `).sync()
    } catch (error) {
      warn(`Failed to git add --all .`);
    }

    try {
      this.run(`git commit -m "new version ${newVer}"`).sync()
    } catch (error) {
      warn(`Failed to git commit -m "new vers...`);
    }
  }

  public async release(c?: ReleaseOptions) {

    this.checkIfLogginInToNpm()

    const { prod = false, bumbVersionIn = [] } = c;

    this.checkIfReadyForNpm()
    const newVersion = Project.Current.versionPatchedPlusOne;
    const self = this;
    function removeTagAndCommit(tagOnly = false) {
      console.log(`PLEASE RUN: `)
      if (!tagOnly) {
        console.log(`git reset --hard HEAD~1`)
      }
      console.log(`git tag --delete v${newVersion}`)
    }

    await questionYesNo(`Release new version: ${newVersion} ?`, async () => {

      this.bumpVersionInOtherProjects(bumbVersionIn, newVersion, true)
      this.commit(newVersion);

      try {
        this.run(`npm version patch`).sync()
      } catch (e) {
        removeTagAndCommit(true)
        error(e);
      }

      this.run(`tnp clear`).sync();

      if (!this.node_modules.exist()) {
        install('', this, false, false);
      }
      this.packageJson.saveForInstall(true)
      this.recreate.init();
      await this.build({
        prod, outDir: config.folder.bundle as 'bundle'
      })
      if (!this.isCommandLineToolOnly) {
        this.createClientVersionAsCopyOfBrowser()
      }

      this.bundleResources()
      this.packageJson.saveForInstall(false)
      this.commit(newVersion);
    }, () => {
      if (this.isBundleMode) {
        return
      } else {
        process.exit(0)
      }
    })


    await questionYesNo(`Publish on npm version: ${newVersion} ?`, async () => {
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
        this.bumpVersionInOtherProjects(bumbVersionIn, newVersion);
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

  private createClientVersionAsCopyOfBrowser() {
    const bundleFolder = path.join(this.location, config.folder.bundle);
    const browser = path.join(bundleFolder, config.folder.browser)
    const client = path.join(bundleFolder, config.folder.client)
    tryCopyFrom(browser, client);
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


}
//#endregion
