//#region @backend
import { BuildProcess } from '../../features';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as getDependents from 'npm-get-dependents';
import chalk from 'chalk';
//#endregion
import type { Project } from './project';
import * as _ from 'lodash';
import { Models } from 'tnp-models';
import { Helpers, Project as $Project } from 'tnp-helpers';
import { config } from 'tnp-config';


/**
 * Project ready to be build/publish as npm package.
 * Also ready to be linked as package in workspace.
 *  - isomorphic-lib
 *  - angular-lib
 */
export abstract class LibProject {

  get isGlobalSystemTool(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isGlobalSystemTool;
    }
    //#region @backend
    return this.packageJson && this.packageJson.isGlobalSystemTool;
    //#endregion
  }

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

  recreateIfNotExists() {
    return [];
  }

  projectSpecyficFiles(this: Project) {
    const files = [
      'index.js',
      'index.d.ts',
      'index.js.map',
    ];
    return files;
  }

  projectSpecyficFilesLinked(this: Project) {
    const files = [
    ];
    return files;
  }


  async buildLib() {
    Helpers.log(`[buildLib] callend buildLib not implemented`)
  }

  checkIfLogginInToNpm(this: Project) {
    // if (!this.canBePublishToNpmRegistry) {
    //   return;
    // }
    try {
      this.run('npm whoami').sync();
    } catch (e) {
      Helpers.error(`Please login in to npm.`, false, true)
    }
  }

  protected beforeLibBuild(this: Project, outDir: Models.dev.BuildDir) {

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
  }

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
  protected linkWhenExist(this: Project, source: string, outLInk: string) {
    //#region @backend
    const basename = source;
    source = path.join(this.location, source);
    outLInk = path.join(this.location, outLInk, basename);


    if (Helpers.exists(source)) {
      if (Helpers.isLink(source)) {
        source = Helpers.pathFromLink(source);
      }
      if (Helpers.exists(source)) {
        Helpers.createSymLink(source, outLInk)
      }
    }
    //#endregion
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
      if (this.TnpProject.name === this.name) {
        Helpers.info(`Ommiting version bump ${this.name} - for tnp itself`)
      } else if (this.packageJson.hasDependency(this.TnpProject.name)) {
        Helpers.info(`Ommiting version bump ${this.name} - has tnp as dependency`)
      } else {
        this.TnpProject.packageJson.setDependencyAndSave({
          name: this.name,
          version: newVersion,
        }, `Bump new version "${newVersion}" of ${this.name}`);
        // try { /// TODO FIX THIS broken getDependents
        //   await (new Promise((resolve, reject) => {
        //     try {
        //       getDependents(this.name, (err, packages: any[]) => {
        //         if (err) {
        //           reject(`[${config.frameworkName}] Can't get depended packages..`)
        //         } else {
        //           packages.forEach(pkg => {
        //             Helpers.info(`Please update "${pkg}" depended on this package...`)
        //           })
        //           resolve()
        //         }
        //       });
        //     } catch (error) {
        //       reject(`[${config.frameworkName}] Error while getting depended packages.. `)
        //     }
        //   }));
        // } catch (error) {
        //   Helpers.warn(`[${config.frameworkName}] `
        //     + `Not able to show dependent packages for ${chalk.bold(this.name)}`)
        // }
      }
    }
  }

  private commit(this: Project, newVer: string, message = 'new version') {
    this.git.commit(`${message} ${newVer}`);
  }

  public compileES5version(this: Project) {

    // TODO fix this for angular-lib

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

  }

  public async installLocaly(this: Project, releaseOptions?: Models.dev.ReleaseOptions) {
    const packageName = this.extensionVsixName;
    if (this.isVscodeExtension) {
      if (!this.containsFile(config.folder.out)) {
        Helpers.error(`Please build your project: ${config.frameworkName} build:dist`, false, true);
      }
      Helpers.info(`Installing extension: ${packageName} `
        + `with creation date: ${fse.lstatSync(this.path(packageName).absolute.normal).birthtime}...`);
      this.run(`npm-run vsce package && code --install-extension ${packageName}`).sync();
    }
  }

  public async release(this: Project, releaseOptions?: Models.dev.ReleaseOptions) {
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

    this.checkIfReadyForNpm();
    const newVersion = this.versionPatchedPlusOne;

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
      this.run(`tnp init`).sync();

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
      this.compileES5version();

      this.bundleResources()
      this.commit(newVersion);
    }, () => {
      process.exit(0);
    });

    // this.packageJson.data.version = newVersion;
    // this.packageJson.save(`[release tnp]`);

    config.packageJsonSplit.forEach(c => {
      const property = c
        .replace(`${config.file.package_json}_`, '')
        .replace(`.json`, '');
      Helpers.setValueToJSON(
        path.join(this.location, config.folder.bundle, config.file.package_json),
        property, void 0);
    });

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
          const existedBundle = path.join(this.location, 'bundle')
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

        if (this.typeIs('angular-lib') && !global.tnpNonInteractive) {
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


  private async tagVersion(this: Project, newVersion: string) {
    try {
      this.run(`git tag -a v${newVersion} -m "version v${newVersion}"`, { output: false }).sync()
    } catch (error) {
      Helpers.warn(`NOT ABLE TO CREATE A TAG "${newVersion}"`);
      const ver = newVersion.split('.');
      if (ver.length > 0) {
        ver[ver.length - 1] = (parseInt(ver[ver.length - 1]) + 1).toString()
      }
      newVersion = ver.join('.')
      await Helpers.questionYesNo(`Do you wanna try to create tag v${newVersion} ?`, async () => {
        await this.tagVersion(newVersion);
      });
    }
  }

  async pushToGitRepo(this: Project, newVersion: string) {
    await this.tagVersion(newVersion);
    this.packageJson.setBuildHash(this.git.lastCommitHash());
    this.packageJson.save('updating hash');
    this.commit(newVersion, `build hash update`);
    console.log('Pushing to git repository... ')
    const branchName = this.run('git symbolic-ref --short HEAD', { output: false }).sync().toString();
    console.log(`Git branch: ${branchName}`)
    try {
      this.run(`git push origin ${branchName}`, { output: false }).sync()
    } catch (error) {
      Helpers.warn(`NOT ABLE TO PUSH CHANGES TO MASTER`)
    }
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
    Helpers.info(`Resources copied to release folder: ${config.folder.bundle}`)
  }
  //#endregion

}

// export interface LibProject extends Partial<Project> { }

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
