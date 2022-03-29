//#region imports
//#region @backend
import { BuildOptions, BuildProcess } from '../../features';
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import { glob } from 'tnp-core';
import * as getDependents from 'npm-get-dependents';
import chalk from 'chalk';
import * as semver from 'semver';
//#endregion
import { Project } from './project';
import { _ } from 'tnp-core';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { CLASS } from 'typescript-class-helpers';
//#endregion

/**
 * Project ready to be build/publish as npm package.
 * Also ready to be linked as package in workspace.
 *  - isomorphic-lib
 *  - angular-lib
 */
export abstract class LibProject {

  //#region fields & getters
  // @ts-ignore
  get isGlobalSystemTool(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isGlobalSystemTool;
    }
    //#region @backend
    return this.packageJson && this.packageJson.isGlobalSystemTool;
    //#endregion
  }

  // @ts-ignore
  get isCommandLineToolOnly(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isCommandLineToolOnly;
    }
    //#region @backend
    return this.packageJson && this.packageJson.isCommandLineToolOnly;
    //#endregion
  }

  // @ts-ignore
  get isGeneratingControllerEntities(this: Project) {
    //#region @backendFunc
    return this.typeIs('isomorphic-lib') && this.useFramework;
    //#endregion
  }


  get angularCoreAppFiles() {
    //#region @backendFunc
    const files = [
      'app/src/app/app.component.html',
      'app/src/app/app.component.scss',
      'app/src/app/app.component.spec.ts',
      'app/src/app/app.component.ts',
      'app/src/app/app.module.ts',
      'app/src/assets/.gitkeep',
      'app/src/environments/environment.prod.ts',
      'app/src/environments/environment.ts',
      'app/src/app',
      'app/src/assets',
      'app/src/environments',
      'app/src/favicon.ico',
      'app/src/index.html',
      'app/src/main.ts',
      'app/src/polyfills.ts',
      'app/src/styles.scss',
      'app/src/test.ts',
      'app/.browserslistrc',
      'app/.editorconfig',
      'app/.gitignore',
      // 'app/README.md',
      'app/angular.json',
      'app/karma.conf.js',
      'app/package-lock.json',
      'app/package.json',
      'app/src',
      'app/tsconfig.app.json',
      'app/tsconfig.json',
      'app/tsconfig.spec.json'
    ];

    return files;
    //#endregion
  }

  //#endregion

  //#region api

  //#region api / build (watch) angular 13+ app
  async buildAppForAngular13Plus(buildOptions: BuildOptions) {

  }
  //#endregion

  //#region api / build lib
  async buildLib() {
    Helpers.log(`[buildLib] callend buildLib not implemented`)
  }
  //#endregion

  //#region api / before lib build
  protected beforeLibBuild(this: Project, outDir: Models.dev.BuildDir) {
    //#region @backend
    this.copyWhenExist('bin', outDir);
    this.linkWhenExist(config.file.package_json, outDir);
    config.packageJsonSplit.forEach(c => {
      this.copyWhenExist(c, outDir);
    });
    this.copyWhenExist('.npmrc', outDir);
    this.copyWhenExist('.npmignore', outDir);
    this.copyWhenExist('.gitignore', outDir);
    if (this.typeIs('isomorphic-lib')) {
      this.copyWhenExist(config.file.tnpEnvironment_json, outDir);
    }
    if (outDir === 'bundle') {
      this.linkWhenExist(config.folder.node_modules, outDir);
      this.linkWhenExist('package.json', path.join(outDir, config.folder.client));
    }
    //#endregion
  }
  //#endregion

  //#region api / release


  public async release(this: Project, releaseOptions?: Models.dev.ReleaseOptions, automaticRelease = false) {
    //#region @backend

    //#region handle realeas temp folder
    // @ts-ignore
    Helpers.log(`LIB: automaticRelease=${automaticRelease}`);
    Helpers.log(`LIB: global.tnpNonInteractive=${global.tnpNonInteractive}`);
    if (_.isUndefined(releaseOptions.useTempFolder)) {
      if (!this.checkIfReadyForNpm(true)) {
        Helpers.warn(`Project "${this.name}" is not ready for npm release`)
        return;
      }
      if (this.isPrivate) {
        Helpers.warn(`Cannot release private project ${chalk.bold(this.genericName)}`)
        return;
      }
      if (this.targetProjects.exists) {
        if (global.tnpNonInteractive) {
          Helpers.warn(`Ommiting relese for project with "target projects"`);
          Helpers.sleep(3);
          return;
        }
        Helpers.error(`You can't release project with target projects`, false, true);
      }
      releaseOptions.useTempFolder = true;
    }

    const baseFolder = path.join(this.location, 'tmp-bundle-release');
    const absolutePathReleaseProject = path.join(baseFolder, 'bundle', 'project', this.name);

    if (this.isStandaloneProject) {
      if (releaseOptions.useTempFolder) {

        Helpers.removeFolderIfExists(baseFolder);

        const browserFolder = path.join(this.location, config.folder.browser);

        if (!Helpers.exists(browserFolder)) {
          Helpers.remove(browserFolder);
        }

        Helpers.removeFolderIfExists(absolutePathReleaseProject);
        Helpers.mkdirp(absolutePathReleaseProject);
        this.copyManager.generateSourceCopyIn(absolutePathReleaseProject, {
          useTempLocation: true, // TODO not needed
          markAsGenerated: false, // TODO not needed
          forceCopyPackageJSON: true, // TODO not needed
        });
        this.packageJson.linkTo(absolutePathReleaseProject, true);

        const generatedProject = Project.From(absolutePathReleaseProject) as Project;
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

        this.node_modules.linkToProject(generatedProject as Project);
        releaseOptions.useTempFolder = false;
        const vscodeFolder = path.join(generatedProject.location, config.folder._vscode);
        Helpers.removeFolderIfExists(vscodeFolder);
        await generatedProject.insideStructure.recrate('bundle')
        await generatedProject.release(releaseOptions, automaticRelease);
        return;
      }
    }
    //#endregion

    const realCurrentProjLocation = (!releaseOptions.useTempFolder && this.isStandaloneProject) ?
      path.resolve(path.join(this.location, '..', '..', '..', '..')) : this.location;
    // const PorjectClass = CLASS.getBy('Project') as typeof Project;

    const realCurrentProj = Project.From(realCurrentProjLocation) as Project;


    this.bumpVersionForPath(realCurrentProj);


    this.checkIfLogginInToNpm();

    const { prod = false, obscure, uglify, nodts } = releaseOptions;

    this.checkIfReadyForNpm();
    const newVersion = realCurrentProj.version;

    function removeTagAndCommit() {
      // Helpers.error(`PLEASE RUN: `, true, true);
      // if (!tagOnly) {
      //   Helpers.error(`git reset --hard HEAD~1`, true, true);
      // }
      Helpers.error(`'release problem... `, automaticRelease, true);
      // if (automaticRelease) {
      //   Helpers.error('release problem...', false, true);
      // }
    }

    await Helpers.questionYesNo(`Release new version: ${newVersion} ?`, async () => {

      await this.bumpVersionInOtherProjects(newVersion, true)

      this.commit(newVersion);

      // try {
      //   this.run(`npm version patch`).sync()
      // } catch (e) {
      //   removeTagAndCommit(true);
      // }

      // this.run(`tnp reset`).sync();

      if (!this.node_modules.exist) {
        await this.npmPackages.installProcess(`release procedure`)
      }
      this.packageJson.data.version = newVersion;
      this.packageJson.save('show for release')
      this.run(`${config.frameworkName} init`).sync();

      Helpers.info(`BUILD OPTION (${this.name}):
      prod=${!!prod},
      obscure=${!!obscure},
      nodts=${!!nodts},
      uglify=${!!uglify}
      `)

      await this.build(BuildProcess.prepareOptionsBuildProcess({
        prod,
        obscure,
        nodts,
        uglify,
        outDir: config.folder.bundle as 'bundle',
        args: releaseOptions.args
      }, this));

      if (!this.isCommandLineToolOnly) {
        this.createClientVersionAsCopyOfBrowser();
      }

      if (this.typeIs('angular-lib')) {
        // copy all dts from browser to backend angular-lib files
        glob.sync(`${path.join(this.location,
          config.folder.bundle,
          config.folder.browser)}/**/*.d.ts`)
          .forEach(f => {
            const newDest = f.replace(
              `${path.join(this.location, config.folder.bundle, config.folder.browser)}/`,
              `${path.join(this.location, config.folder.bundle)}/`);
            Helpers.copyFile(f, newDest);
          });
      }
      this.compileBrowserES5version();

      this.bundleResources()
      this.commit(newVersion);
    }, () => {
      process.exit(0);
    });

    // this.packageJson.data.version = newVersion;
    // this.packageJson.save(`[release tnp]`);

    // config.packageJsonSplit.forEach(c => { // TODO QUCK fix -> it was cousing git conflicts in package.json
    //   const property = c
    //     .replace(`${config.file.package_json}_`, '')
    //     .replace(`.json`, '');
    //   Helpers.setValueToJSON(
    //     path.join(this.location, config.folder.bundle, config.file.package_json),
    //     property, void 0);
    // });

    [
      // config.folder.browser, /// TODO FIX for typescript
      config.folder.client,
      '',
    ].forEach(c => {
      const pjPath = path.join(this.location, config.folder.bundle, c, config.file.package_json);
      const content = Helpers.readJson(pjPath);
      Helpers.remove(pjPath);
      Helpers.writeFile(pjPath, content);
    });
    this.packageJson.showDeps(`after release show when ok`);

    if (this.packageJson.name === 'tnp') {  // TODO QUICK_FIX
      Helpers.setValueToJSON(path.join(this.location, config.folder.bundle, config.file.package_json), 'dependencies',
        this.TnpProject.packageJson.data.tnp.overrided.includeOnly.reduce((a, b) => {
          return _.merge(a, {
            [b]: this.TnpProject.packageJson.data.dependencies[b]
          })
        }, {})
      );
    }

    if (!global.tnpNonInteractive) {
      this.run(`code .`).sync();
      Helpers.pressKeyAndContinue(`Check your bundle and press any key...`)
    }

    await Helpers.questionYesNo(`Publish on npm version: ${newVersion} ?`, async () => {
      let successPublis = false;
      try {
        this.run('npm publish', {
          cwd: path.join(this.location, config.folder.bundle),
          output: true
        }).sync();
        successPublis = true;
      } catch (e) {
        removeTagAndCommit()
      }

      if (successPublis) {
        //#region release additional packages names
        const names = this.packageJson.additionalNpmNames;
        for (let index = 0; index < names.length; index++) {
          const c = names[index];
          const existedBundle = path.join(this.location, 'bundle');
          const additionBase = path.resolve(path.join(this.location, `../../../additional-bundle-${c}`));
          Helpers.mkdirp(additionBase);
          Helpers.copy(existedBundle, additionBase, {
            copySymlinksAsFiles: true,
            omitFolders: [config.folder.node_modules],
            omitFoldersBaseFolder: existedBundle
          });
          const pathPackageJsonRelease = path.join(additionBase, config.file.package_json);
          const packageJsonAdd: Models.npm.IPackageJSON = Helpers.readJson(path.join(additionBase, config.file.package_json));
          packageJsonAdd.name = c;
          // const keys = Object.keys(packageJsonAdd.bin || {});
          // keys.forEach(k => {
          //   const v = packageJsonAdd.bin[k] as string;
          //   packageJsonAdd.bin[k.replace(this.name, c)] = v.replace(this.name, c);
          //   delete packageJsonAdd.bin[k];
          // });
          Helpers.writeFile(pathPackageJsonRelease, packageJsonAdd);
          Helpers.info('log addtional bundle created');
          try {
            if (!global.tnpNonInteractive) {
              Helpers.run(`code ${additionBase}`).sync();
              Helpers.info(`Check you additional bundle for ${chalk.bold(c)} and press any key to publish...`);
              Helpers.pressKeyAndContinue();
            }
            Helpers.run('npm publish', { cwd: additionBase }).sync();
          } catch (error) {
            Helpers.warn(`No able to push additional bundle for name: ${c}`)
          }
        }
        //#endregion

        await this.bumpVersionInOtherProjects(newVersion);

        if ((this.typeIs('angular-lib') || (this.typeIs('isomorphic-lib') && this.frameworkVersionAtLeast('v3')))
          && !global.tnpNonInteractive) {
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
            const init = this.frameworkVersionAtLeast('v3') ? `${config.frameworkName} build:dist && ` : '';
            await this.run(`${init}`
              + `${config.frameworkName} build:app${appBuildOptions.docsAppInProdMode ? 'prod' : ''}`).sync();

            if (this.frameworkVersionAtLeast('v3')) {
              const currentDocs = path.join(this.location, config.folder.docs);
              const currentDocsDest = path.join(this.location, '..', '..', '..', '..', config.folder.docs);
              Helpers.removeFolderIfExists(currentDocsDest);
              Helpers.copy(currentDocs, currentDocsDest, { recursive: true })
            }

            Helpers.log(`

          Building docs prevew - done

          `);
            await this.pushToGitRepo(newVersion, realCurrentProj)
          }, async () => {
            await this.pushToGitRepo(newVersion, realCurrentProj)
          });
        } else {
          await this.pushToGitRepo(newVersion, realCurrentProj)
        }

      }
    }, () => {
      removeTagAndCommit();
    });




    const tnpProj = Project.Tnp as Project;

    if (tnpProj) {
      tnpProj.packageJson.save('showing for trusted')

      let firedeProj: Project;
      if (this.packageJson.name === config.frameworkNames.tnp) {  // TODO QUICK_FIX
        firedeProj = Project.From(path.join(path.dirname(realCurrentProj.location), config.frameworkNames.firedev))
      }
      const coreCont = Project.by('container', realCurrentProj._frameworkVersion) as Project;

      const arrTrusted = tnpProj.packageJson.data.tnp.core.dependencies.trusted[this._frameworkVersion];
      if (
        (_.isString(arrTrusted) && (arrTrusted === '*')) ||
        (_.isArray(arrTrusted) && arrTrusted.includes(this.name))
      ) {
        [
          firedeProj,
          coreCont,
        ].filter(f => !!f)
          .forEach(c => {
            c.smartNodeModules.updateFromReleaseBundle(realCurrentProj);
          });
      }
    }


    //#endregion
  }
  //#endregion

  //#region api / create client version as copy of browser
  private createClientVersionAsCopyOfBrowser(this: Project) {
    //#region @backend
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
    //#endregion
  }
  //#endregion

  //#region api / bundle resource
  public bundleResources(this: Project) {
    //#region @backend
    this.checkIfReadyForNpm()
    const bundleFolder = path.join(this.location, config.folder.bundle);
    if (!fse.existsSync(bundleFolder)) {
      fse.mkdirSync(bundleFolder);
    }
    [].concat(this.resources).forEach(res => {
      const file = path.join(this.location, res);
      const dest = path.join(bundleFolder, res);
      if (!fse.existsSync(file)) {
        Helpers.error(`[${config.frameworkName}][lib-project] Resource file: ${chalk.bold(path.basename(file))} does not `
          + `exist in "${this.genericName}"  (package.json > tnp.resources[])
        `, false, true)
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
    Helpers.info(`Resources copied to release folder: ${config.folder.bundle}`);
    //#endregion
  }
  //#endregion

  //#endregion

  //#region methods

  //#region methods / project linked files
  projectLinkedFiles(this: Project): { sourceProject: Project, relativePath: string }[] {
    const files = [];
    return files;
  }
  //#endregion

  //#region methods / create if not exists
  recreateIfNotExists() {
    return [];
  }
  //#endregion

  //#region methods / project specify files
  projectSpecyficFiles(this: Project) {
    const files = [
      'index.js',
      'index.d.ts',
      'index.js.map',
    ];
    return files;
  }
  //#endregion

  //#region methods / project specyfic files linked
  projectSpecyficFilesLinked(this: Project) {
    const files = [
    ];
    return files;
  }
  //#endregion

  //#region methods / check if loggin in to npm
  private checkIfLogginInToNpm(this: Project) {
    //#region @backend
    // if (!this.canBePublishToNpmRegistry) {
    //   return;
    // }
    try {
      this.run('npm whoami').sync();
    } catch (e) {
      Helpers.error(`Please login in to npm.`, false, true)
    }
    //#endregion
  }
  //#endregion

  //#region methods / copy when exists
  protected copyWhenExist(this: Project, source: string, outDir: string) {
    //#region @backend
    const basename = source;
    source = path.join(this.location, source);
    const dest = path.join(this.location, outDir, basename);
    if (Helpers.exists(source)) {
      if (Helpers.isFolder(source)) {
        Helpers.tryCopyFrom(source, dest);
      } else {
        Helpers.copyFile(source, dest);
        if (path.basename(source) === config.file.tnpEnvironment_json) {
          Helpers.setValueToJSON(dest, 'currentProjectLocation', void 0);
        }
      }
    } else {
      Helpers.log(`[isomorphic-lib][copyWhenExist] not exists: ${source}`);
    }
    //#endregion
  }
  //#endregion

  //#region methods / link when exists
  protected linkWhenExist(this: Project, source: string, outLInk: string) {
    //#region @backend
    const basename = source;
    source = path.join(this.location, source);
    outLInk = path.join(this.location, outLInk, basename);


    if (Helpers.exists(source)) {
      if (Helpers.isExistedSymlink(source)) {
        source = Helpers.pathFromLink(source);
      }
      if (Helpers.exists(source)) {
        Helpers.createSymLink(source, outLInk)
      }
    }
    //#endregion
  }
  //#endregion

  //#region methods / bump version in other projects
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
      if (this.TnpProject.name === this.name) {
        Helpers.info(`Ommiting version bump ${this.name} - for tnp itself`)
      } else if (this.packageJson.hasDependency(this.TnpProject.name)) {
        Helpers.info(`Ommiting version bump ${this.name} - has tnp as dependency`)
      } else {
        this.TnpProject.packageJson.setDependencyAndSave({
          name: this.name,
          version: newVersion,
        }, `Bump new version "${newVersion}" of ${this.name}`);
      }
    }
  }
  //#endregion

  //#region methods / commit
  private commit(this: Project, newVer: string, message = 'new version') {
    //#region @backend
    this.git.commit(`${message} ${newVer}`);
    //#endregion
  }
  //#endregion

  //#region methods / compile es5
  private compileBrowserES5version(this: Project) {
    //#region @backend
    // TODO fix this for angular-lib
    if (this.frameworkVersionAtLeast('v3')) {
      return;
    }

    if (this.frameworkVersionEquals('v1') || this.typeIsNot('isomorphic-lib')) {
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
    //#endregion
  }
  //#endregion

  //#region methods / install locally
  public async installLocaly(this: Project, releaseOptions?: Models.dev.ReleaseOptions) {
    //#region @backend
    if (this.isVscodeExtension) {
      const vsixPackageName = this.extensionVsixName;
      if (!this.containsFile(config.folder.out)) {
        Helpers.error(`Please build your project: ${config.frameworkName} build:dist`, false, true);
      }
      // if (!Helpers.exists(this.path(vsixPackageName).absolute.normal)) {
      await this.createVscePackage(false);
      // }
      Helpers.info(`Installing extension: ${vsixPackageName} `
        + `with creation date: ${fse.lstatSync(this.path(vsixPackageName).absolute.normal).birthtime}...`);
      this.run(`code --install-extension ${vsixPackageName}`).sync();
    }
    //#endregion
  }
  //#endregion

  //#region methods / create vscode package
  private async createVscePackage(this: Project, showInfo = true) {
    //#region @backend
    const vsixPackageName = this.extensionVsixName;
    try {
      await Helpers.actionWrapper(() => {
        this.run(`npm-run vsce package --yarn`).sync();
      }, `Building vsix package ` + chalk.bold(vsixPackageName) + `... `);
      if (showInfo) {
        const commandInstall = chalk.bold(`${config.frameworkName} install:locally`);
        Helpers.info(`

        Please use command: ${commandInstall} # or ${config.frameworkName} il
        to install this package in local vscode instance.

        `)
      }
    } catch (error) {
      Helpers.error(error, true, true);
      Helpers.error(`Not able to build ${vsixPackageName} package `);
    }
    //#endregion
  }
  //#endregion

  //#region methods / tag version
  private async tagVersion(this: Project, newVersion: string) {
    //#region @backend
    return this.createNewVersionWithTagFor.pathRelease(`version v${newVersion}`).newVersion;
    //#endregion
  }
  //#endregion

  //#region methods / push to git repo
  private async pushToGitRepo(this: Project, newVersion: string, realCurrentProj: Project) {
    //#region @backend
    newVersion = await this.tagVersion(newVersion);
    realCurrentProj.packageJson.setBuildHash(this.git.lastCommitHash());
    realCurrentProj.packageJson.save('updating hash');
    this.commit(newVersion, `build hash update`);
    Helpers.log('Pushing to git repository... ')
    Helpers.log(`Git branch: ${this.git.currentBranchName}`);
    this.git.pushCurrentBranch();
    Helpers.info('Pushing to git repository done.');
    //#endregion
  }
  //#endregion

  //#endregion

}

//#region @backend
export function updateChildrenVersion(project: Project, newVersion, name, updatedProjectw: Project[] = []) {
  if (updatedProjectw.filter(p => p.location === project.location).length > 0) {
    Helpers.log(`[release - ${name}][lib-proj] Alredy update ${project.genericName}`)
    return;
  }
  if (project.name !== name) {
    project.packageJson.setDependencyAndSave({
      name,
      version: newVersion
    }, `Bump versoin of library ${name}`);
  } else {
    project.packageJson.data.version = newVersion;
    project.packageJson.save(`[lib-proj] set version`);
  }
  updatedProjectw.push(project);
  Helpers.log(`[release - ${name}][lib-proj] children of ${project.genericName}: \n${project.children.map(c => c.location)}\n`)
  project.children.forEach(childProject => updateChildrenVersion(childProject, newVersion, name, updatedProjectw));
}
//#endregion
