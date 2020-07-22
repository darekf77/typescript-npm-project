//#region @backend
import { BuildProcess } from '../../features';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as getDependents from 'npm-get-dependents';
//#endregion
import type { Project } from './project';
import * as _ from 'lodash';
import { Models } from 'tnp-models';
import { Helpers, Project as $Project } from 'tnp-helpers';
import { config } from '../../../config';

/**
 * Project ready to be build/publish as npm package.
 * Also ready to be linked as package in workspace.
 *  - isomorphic-lib
 *  - angular-lib
 */
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
    //#region @backendFunc
    return this.typeIs('isomorphic-lib') && this.useFramework;
    //#endregion
  }


  //#region @backend
  projectLinkedFiles(this: Project): { sourceProject: Project, relativePath: string }[] {
    const files = [];
    return files;
  }

  projectSpecyficFiles(this: Project) {
    const files = [
      'index.js',
      'index.d.ts',
      'index.js.map',
    ];
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
      this.TnpProject.packageJson.setDependencyAndSave({
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
    const gitRootProject = $Project.nearestTo(this.location, { findGitRoot: true });
    try {
      Helpers.info(`[git][release] Adding current git changes...`)
      gitRootProject.run(`git add --all . `).sync()
    } catch (error) {
      Helpers.warn(`Failed to git add --all .`);
    }

    try {
      Helpers.info(`[git][release] Commiting automatic message`)
      gitRootProject.run(`git commit -m "new version ${newVer}"`).sync()
    } catch (error) {
      Helpers.warn(`Failed to git commit -m "new vers...`);
    }
  }

  public compileES5version(this: Project) {

    if (this.frameworkVersionEquals('v1')) {
      return;
    }

    const pathBundle = path.join(this.location, config.folder.bundle);
    const cwdBrowser = path.join(pathBundle, config.folder.browser);
    const cwdClient = path.join(pathBundle, config.folder.client);
    const pathBabelRc = path.join(cwdBrowser, config.file._babelrc);
    const pathCompiled = path.join(cwdBrowser, 'es5');
    const pathCompiledClient = path.join(cwdClient, 'es5');
    Helpers.writeFile(pathBabelRc, '{ "presets": ["env"] }\n');
    try {
      Helpers.run(`babel . -d es5`, { cwd: cwdBrowser }).sync();
      Helpers.copy(pathCompiled, pathCompiledClient);
    } catch (err) {
      Helpers.removeFileIfExists(pathBabelRc);
      Helpers.error(err, true, true);
      Helpers.error(`Not able to create es5 version of lib`, false, true);
    }
    Helpers.removeFileIfExists(pathBabelRc);

  }

  public async release(this: Project, releaseOptions?: Models.dev.ReleaseOptions) {
    if (_.isUndefined(releaseOptions.useTempFolder)) {
      releaseOptions.useTempFolder = true;
    }

    const baseFolder = path.join(this.location, 'tmp-bundle-release');
    const absolutePathReleaseProject = path.join(baseFolder, 'bundle', 'project', this.name);

    if (this.isStandaloneProject) {
      if (releaseOptions.useTempFolder) {

        Helpers.removeFolderIfExists(baseFolder);

        Helpers.removeFolderIfExists(absolutePathReleaseProject);
        Helpers.mkdirp(absolutePathReleaseProject);
        this.copyManager.generateSourceCopyIn(absolutePathReleaseProject, {
          useTempLocation: true, // TODO not needed
          markAsGenerated: false, // TODO not needed
          forceCopyPackageJSON: true, // TODO not needed
        });

        const generatedProject = $Project.From(absolutePathReleaseProject) as Project;
        this.allResources.forEach(relPathResource => {
          const source = path.join(this.location, relPathResource);
          const dest = path.join(absolutePathReleaseProject, relPathResource);
          if (Helpers.exists(source)) {
            if (Helpers.isFolder(source)) {
              Helpers.copy(source, dest);
            } else {
              Helpers.copyFile(source, dest);
            }
          }
        })
        this.packageJson.linkTo(absolutePathReleaseProject);
        this.node_modules.linkToProject(generatedProject as Project);
        releaseOptions.useTempFolder = false;
        const vscodeFolder = path.join(generatedProject.location, config.folder._vscode);
        Helpers.removeFolderIfExists(vscodeFolder);
        await generatedProject.release(releaseOptions);
        return;
      }
    }

    this.checkIfLogginInToNpm();

    const { prod = false, obscure, uglify, nodts } = releaseOptions;

    this.checkIfReadyForNpm()
    const newVersion = this.CurrentProject.versionPatchedPlusOne;

    function removeTagAndCommit(tagOnly = false) {
      Helpers.error(`PLEASE RUN: `, true, true)
      if (!tagOnly) {
        Helpers.error(`git reset --hard HEAD~1`, true, true)
      }
      Helpers.error(`git tag --delete v${newVersion}`, false, true)
    }

    await Helpers.questionYesNo(`Release new version: ${newVersion} ?`, async () => {

      if (!this.isTnp) {
        await this.bumpVersionInOtherProjects(newVersion, true)
      }
      this.commit(newVersion);

      try {
        this.run(`npm version patch`).sync()
      } catch (e) {
        removeTagAndCommit(true);
      }

      // this.run(`tnp reset`).sync();

      if (!this.node_modules.exist) {
        await this.npmPackages.installProcess(`release procedure`)
      }
      this.packageJson.save('show for release')
      this.run(`tnp init`).sync();
      await this.build(BuildProcess.prepareOptionsBuildProcess({
        prod,
        obscure,
        nodts,
        uglify,
        outDir: config.folder.bundle as 'bundle',
        args: releaseOptions.args
      }, this));

      if (!this.isCommandLineToolOnly) {
        this.createClientVersionAsCopyOfBrowser()
      }

      if (this.typeIs('angular-lib')) {

        if (this.frameworkVersionEquals('v1')) {
          Helpers.writeFile(`${path.join(this.location, config.folder.bundle, 'index.js')}`, `
                "use strict";
                Object.defineProperty(exports, '__esModule', { value: true });
                var tslib_1 = require('tslib');
                tslib_1.__exportStar(require('./browser'), exports);
                        `.trim());
        } else {
          Helpers.writeFile(`${path.join(this.location, config.folder.bundle, 'index.js')}`, `
                export * from './browser';
              `.trim());
        }



        Helpers.writeFile(`${path.join(this.location, config.folder.bundle, 'index.d.ts')}`, `
      export * from './browser';
              `.trim());
      }
      this.compileES5version();

      this.bundleResources()
      this.commit(newVersion);
    }, () => {
      if (this.isBundleMode) {
        Helpers.warn(`Project not in bundle mode return`)
        return;
      } else {
        Helpers.warn(`Project not in bundle mode exit`);
        process.exit(0)
      }
    });
    if (this.isTnp) { // QUICK_FIX tnp release
      this.packageJson.data.version = newVersion;
      this.packageJson.save(`[release tnp]`);
    }

    this.run(`code .`).sync();
    Helpers.pressKeyAndContinue(`Check your bundle and press any key...`)

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
        if (!this.isTnp) {
          await this.bumpVersionInOtherProjects(newVersion);
        }
        if (this.typeIs('angular-lib')) {
          await Helpers.questionYesNo(`Do you wanna build docs for github preview`, async () => {

            let appBuildOptions = { docsAppInProdMode: prod };

            await Helpers.questionYesNo(`Do you wanna build in production mode`, () => {
              appBuildOptions.docsAppInProdMode = true;
            }, () => {
              appBuildOptions.docsAppInProdMode = false;
            });

            Helpers.log(`

          Building docs prevew - start

          `);
            await this.run(`tnp build:app${appBuildOptions.docsAppInProdMode ? 'prod' : ''}`).sync();
            Helpers.log(`

          Building docs prevew - done

          `);
            this.pushToGitRepo(newVersion)
          }, () => {
            this.pushToGitRepo(newVersion)
          });
        } else {
          this.pushToGitRepo(newVersion)
        }
      }
    }, () => {
      removeTagAndCommit()
    })

  }

  pushToGitRepo(this: Project, newVersion: string) {

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

//#region @backend
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
//#endregion
