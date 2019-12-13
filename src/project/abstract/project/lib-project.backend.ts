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
    if (Helpers.isBrowser) {
      return this.browser.isCommandLineToolOnly;
    }
    //#region @backend
    return this.packageJson && this.packageJson.isCommandLineToolOnly;
    //#endregion
  }

  get isGeneratingControllerEntities(this: Project) {
    return this.type === 'isomorphic-lib' && this.useFramework;
  }

  //#region @backend
  projectSpecyficFiles(this: Project) {
    const files = [
      'index.js',
      'index.d.ts',
      'index.js.map',
    ]
    return files;
  }


  async buildLib() {
    Helpers.log(`[buildLib] callend buildLib not implemented`)
  }

  checkIfLogginInToNpm(this: Project) {
    try {
      this.run('npm whoami').sync();
    } catch (e) {
      Helpers.error(`Please login in to npm.`, false, true)
    }
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
      updateChildrenVersion(this, newVersion, this.name);
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
      Helpers.error(`PLEASE RUN: `, true, true)
      if (!tagOnly) {
        Helpers.error(`git reset --hard HEAD~1`, true, true)
      }
      Helpers.error(`git tag --delete v${newVersion}`, false, true)
    }

    await Helpers.questionYesNo(`Release new version: ${newVersion} ?`, async () => {

      await this.bumpVersionInOtherProjects(newVersion, true)
      this.commit(newVersion);

      try {
        this.run(`npm version patch`).sync()
      } catch (e) {
        removeTagAndCommit(true);
      }

      this.run(`tnp reset`).sync();

      if (!this.node_modules.exist) {
        await this.npmPackages.installProcess(`release procedure`)
      }
      this.packageJson.save('show for release')
      this.run(`tnp init`).sync();
      await this.build(BuildProcess.prepareOptionsBuildProcess({
        prod, outDir: config.folder.bundle as 'bundle', args: c.args
      }, this));

      if (this.type === 'angular-lib') {
        Helpers.log(`

      Building docs prevew - start

      `);
        await this.run(`tnp build:app`).sync();
        Helpers.log(`

      Building docs prevew - done

      `);
      }

      if (!this.isCommandLineToolOnly) {
        this.createClientVersionAsCopyOfBrowser()
      }
      if (this.type === 'angular-lib') {
        Helpers.writeFile(`${path.join(this.location, config.folder.bundle, 'index.js')}`, `
"use strict";
Object.defineProperty(exports, '__esModule', { value: true });
var tslib_1 = require('tslib');
tslib_1.__exportStar(require('./browser'), exports);
        `.trim());
        Helpers.writeFile(`${path.join(this.location, config.folder.bundle, 'index.d.ts')}`, `
export * from './browser';
        `.trim());
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
      } catch (e) {
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
    if (fse.existsSync(browser)) {
      Helpers.tryCopyFrom(browser, client);
    } else {
      Helpers.warn(`Browser forlder not generated.. replacing with dummy files: browser.js, client.js`,
        false);
      const msg = `console.log('${this.genericName} only for backend') `;
      Helpers.writeFile(`${browser}.js`, msg);
      Helpers.writeFile(`${client}.js`, msg);
    }

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
        const filter = (src) => {
          return !/.*node_modules.*/g.test(src);
        };
        Helpers.copy(file, dest, { filter });
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
export function updateChildrenVersion(project: Project, newVersion, name, updatedProjectw: Project[] = []) {
  if (updatedProjectw.filter(p => p.location === project.location).length > 0) {
    Helpers.log(`[release - ${name}][updateChildrenVersion] Alredy update ${project.genericName}`)
    return;
  }
  if (project.name !== name) {
    project.packageJson.setDependencyAndSave({
      name,
      version: newVersion
    }, `Bump versoin of library ${name}`);
  } else {
    project.packageJson.data.version = newVersion;
    project.packageJson.save(`[updateChildrenVersion] set version`);
  }
  updatedProjectw.push(project);
  Helpers.log(`[release - ${name}][updateChildrenVersion] children of ${project.genericName}: \n${project.children.map(c => c.location)}\n`)
  project.children.forEach(childProject => updateChildrenVersion(childProject, newVersion, name, updatedProjectw));
}
