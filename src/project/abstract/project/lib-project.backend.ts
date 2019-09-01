import { Project } from './project';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as getDependents from 'npm-get-dependents';

import { Models } from '../../../models';
import { Helpers } from '../../../helpers';
import { config } from '../../../config';
import { BuildProcess } from '../../features';
import { Morphi } from 'morphi';

/**
 * Project ready to be build/publish as npm package.
 * Also ready to be linked as package in workspace.
 *  - isomorphic-lib
 *  - angular-lib
 */
//#endregion

export abstract class LibProject {


  get isCommandLineToolOnly(this: Project) {
    if (Morphi.IsBrowser) {
      return this.browser.isCommandLineToolOnly;
    }
    //#region @backend
    return this.packageJson && this.packageJson.isCommandLineToolOnly;
    //#endregion
  }
  get isBuildedLib(this: Project) {
    if (Morphi.IsBrowser) {
      return this.browser.isBuildedLib;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return false;
    }
    if (this.type === 'angular-lib') {
      return fse.existsSync(path.join(this.location, config.folder.module)) &&
        fse.existsSync(path.join(this.location, config.folder.dist));
    }
    if (this.type === 'isomorphic-lib') {
      return fse.existsSync(path.join(this.location, config.folder.browser)) &&
        fse.existsSync(path.join(this.location, config.folder.dist));
    }
    return false;
    //#endregion
  }

  //#region @backend
  projectSpecyficFiles(this: Project) {
    const files = [
      'index.js',
      'index.d.ts',
      'index.js.map'
    ]
    return files;
  }


  abstract async buildLib();

  checkIfLogginInToNpm(this: Project) {
    try {
      this.run('npm whoami').sync();
    } catch (e) {
      Helpers.error(`Please login in to npm.`, false, true)
    }
  }

  private updateChildren(this: Project, project: Project, newVersion, updatedProjectw: Project[] = []) {
    if (updatedProjectw.filter(p => p.location === project.location).length > 0) {
      console.log(`Exition alredy ${project.genericName}`)
      return;
    }
    project.packageJson.setDependencyAndSave({
      name: this.name,
      version: newVersion
    }, `Bump versoin of library ${this.name}`);
    // const packageJson = project.packageJson;
    // if (packageJson && packageJson.data) {
    //   if (project.type !== 'unknow-npm-project') {
    //     project.packageJson.show(`For release of ${this.name}`)
    //   }
    //   let versionBumped = false;
    //   if (packageJson.data.dependencies && packageJson.data.dependencies[this.name]) {
    //     versionBumped = true;
    //     packageJson.data.dependencies[this.name] = newVersion;
    //   }
    //   if (packageJson.data.devDependencies && packageJson.data.devDependencies[this.name]) {
    //     versionBumped = true;
    //     packageJson.data.devDependencies[this.name] = newVersion
    //   }
    //   if (versionBumped) {
    //     packageJson.save(`Version bumped to ${} for ${this.name}  ${}`)
    //     info(`[release - ${this.name}] Version of current project "${this.name}" bumped in ${project.genericName}`)
    //   } else {
    //     log(`[release - ${this.name}] ${this.name} has not a dependency of ${this.name}`)
    //   }
    // } else {
    //   log(`[release - ${this.name}] No package json for ${project.genericName}`)
    // }
    updatedProjectw.push(project);
    console.log(`[release - ${this.name}]  children of ${project.genericName}`, project.children.map(c => c.location))

    project.children.forEach(p => this.updateChildren(p, newVersion, updatedProjectw));
  }

  /**
   * Return how many projects has changed
   * @param bumbVersionIn
   * @param newVersion
   * @param onlyInThisProjectSubprojects
   */
  async bumpVersionInOtherProjects(this: Project, newVersion, onlyInThisProjectSubprojects = false) {
    if (onlyInThisProjectSubprojects) {
      // console.log('UPDATE VERSION !!!!!!!!!!!!!')
      this.updateChildren(this, newVersion);
    } else {
      Project.Tnp.packageJson.setDependencyAndSave({
        name: this.name,
        version: newVersion,
      }, `Bump new version "${newVersion}" of ${this.name}`);
      await (new Promise((resolve, reject) => {
        getDependents(this.name, function (err, packages: any[]) {
          if (err) {
            reject(`[lib-projecty] Can't get depended packages..`)
          } else {
            packages.forEach(pkg => {
              Helpers.info(`Please update "${pkg}" depended on this package...`)
            })
            resolve()
          }
        });
      }));
    }
  }

  private commit(this: Project, newVer) {
    try {
      this.run(`git add --all . `).sync()
    } catch (error) {
      Helpers.warn(`Failed to git add --all .`);
    }

    try {
      this.run(`git commit -m "new version ${newVer}"`).sync()
    } catch (error) {
      Helpers.warn(`Failed to git commit -m "new vers...`);
    }
  }

  public async release(this: Project, c?: Models.dev.ReleaseOptions) {

    this.checkIfLogginInToNpm()

    const { prod = false } = c;

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

    await Helpers.questionYesNo(`Release new version: ${newVersion} ?`, async () => {

      await this.bumpVersionInOtherProjects(newVersion, true)
      this.commit(newVersion);

      try {
        this.run(`npm version patch`).sync()
      } catch (e) {
        removeTagAndCommit(true)
        Helpers.error(e);
      }

      this.run(`tnp reset`).sync();

      if (!this.node_modules.exist) {
        await this.npmPackages.installProcess(`release procedure`)
      }
      this.packageJson.save('show for release')
      await this.recreate.init();
      await this.build(BuildProcess.prepareOptionsLib({
        prod, outDir: config.folder.bundle as 'bundle', args: c.args
      }, this));
      if (!this.isCommandLineToolOnly) {
        this.createClientVersionAsCopyOfBrowser()
      }

      this.bundleResources()
      this.commit(newVersion);
    }, () => {
      if (Project.isBundleMode) {
        Helpers.warn(`Project not in bundle mode return`)
        return;
      } else {
        Helpers.warn(`Project not in bundle mode exit`);
        process.exit(0)
      }
    });

    await Helpers.questionYesNo(`Publish on npm version: ${newVersion} ?`, async () => {
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
        await this.bumpVersionInOtherProjects(newVersion);
        this.pushToGitRepo()
      }
    }, () => {
      removeTagAndCommit()
    })

  }

  pushToGitRepo(this: Project) {
    console.log('Pushing to git repository... ')
    const branchName = this.run('git symbolic-ref --short HEAD', { output: false }).sync().toString();
    console.log(`Git branch: ${branchName}`)
    this.run(`git push origin ${branchName}`, { output: false }).sync()
    Helpers.info('Pushing to git repository done.')
  }

  private createClientVersionAsCopyOfBrowser(this: Project) {
    const bundleFolder = path.join(this.location, config.folder.bundle);
    const browser = path.join(bundleFolder, config.folder.browser)
    const client = path.join(bundleFolder, config.folder.client)
    Helpers.tryCopyFrom(browser, client);
  }

  public bundleResources(this: Project) {

    this.checkIfReadyForNpm()
    const bundleFolder = path.join(this.location, config.folder.bundle);
    if (!fse.existsSync(bundleFolder)) {
      fse.mkdirSync(bundleFolder);
    }
    ['package.json'].concat(this.resources).forEach(res => {
      const file = path.join(this.location, res);
      const dest = path.join(bundleFolder, res);
      if (!fse.existsSync(file)) {
        Helpers.error(`Resource file ${file} does not exist in ${this.location}`)
      }
      if (fse.lstatSync(file).isDirectory()) {
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
    Helpers.info(`Resources copied to release folder: ${config.folder.bundle}`)
  }
  //#endregion

}

// export interface LibProject extends Partial<Project> { }
