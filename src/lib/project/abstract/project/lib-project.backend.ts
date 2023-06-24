//#region imports
import { BuildOptions, BuildProcess, EnvironmentConfig } from '../../features';
import { crossPlatformPath, fse } from 'tnp-core'
import { path } from 'tnp-core'
import { glob } from 'tnp-core';
import * as getDependents from 'npm-get-dependents';
import chalk from 'chalk';
import { Project } from './project';
import { _ } from 'tnp-core';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { Log } from 'ng2-logger';
import { LibProjectStandalone } from './lib-project-standalone.backend';
import { LibProjectSmartContainer } from './lib-project-smart-container.backend';
import { LibProjectVscodeExt } from './lib-project-vscode-ext';
import { DEFAULT_PORT } from '../../../constants';
const log = Log.create(path.basename(__filename))
//#endregion

/**
 * Project ready to be build/publish as npm package.
 * Also ready to be linked as package in workspace.
 *  - isomorphic-lib
 *  - angular-lib
 */
export abstract class LibProject {

  //#region  fields & getters
  private standalone: LibProjectStandalone;
  private smartcontainer: LibProjectSmartContainer;
  public vscodext: LibProjectVscodeExt;

  // @ts-ignore
  libProjectInit(this: Project) {
    this.standalone = new LibProjectStandalone(this as any);
    this.smartcontainer = new LibProjectSmartContainer(this as any);
    this.vscodext = new LibProjectVscodeExt(this as any);
  }

  // @ts-ignore
  get isGlobalSystemTool(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isGlobalSystemTool;
    }
    //
    return this.packageJson && this.packageJson.isGlobalSystemTool;

  }

  // @ts-ignore
  get isCommandLineToolOnly(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isCommandLineToolOnly;
    }
    //
    return this.packageJson && this.packageJson.isCommandLineToolOnly;

  }

  // @ts-ignore
  get isGeneratingControllerEntities(this: Project) {
    //
    return this.typeIs('isomorphic-lib') && this.useFramework;

  }

  // @ts-ignore
  get isInRelaseBundle(this: Project) {
    return this.location.includes('tmp-bundle-release/bundle');
  };


  // angular core app files
  get angularCoreAppFiles() {
    //
    const files = [
      'app/src/app/app.component.html',
      'app/src/app/app.component.scss',
      // 'app/src/app/app.component.spec.ts',
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
      'app/src/jestGlobalMocks.ts',
      'app/src/setupJest.ts',
      // 'app/src/test.ts', not needed with jest
      'app/.browserslistrc',
      'app/.editorconfig',
      'app/.gitignore',
      // 'app/README.md',
      'app/angular.json',
      'app/karma.conf.js',
      'app/jest.config.js',
      'app/package-lock.json',
      'app/package.json',
      'app/src',
      'app/tsconfig.app.json',
      'app/tsconfig.json',
      'app/tsconfig.spec.json'
    ];

    return files;

  }
  //#endregion

  //#region  api

  //#region  api / release

  public async release(this: Project, releaseOptions?: Models.dev.ReleaseOptions) {

    const { prod = false, shouldReleaseLibrary, automaticReleaseDocs, automaticRelease } = releaseOptions;

    if (await this.createTempProject(releaseOptions, automaticRelease)) {
      return;
    }

    //#region prepare variables
    log.data(`automaticRelease=${automaticRelease}`);
    log.data(`global.tnpNonInteractive=${global.tnpNonInteractive}`);

    const realCurrentProjLocation = (!releaseOptions.useTempFolder && (this.isStandaloneProject || this.isSmartContainer)) ?
      path.resolve(path.join(this.location, '..', '..', '..', '..')) : this.location;


    const realCurrentProj = Project.From(realCurrentProjLocation) as Project;
    let specyficProjectForBuild: Project;

    if (shouldReleaseLibrary && !automaticReleaseDocs) {


      var newVersion = realCurrentProj.version;

      this.checkIfLogginInToNpm();

      this.checkIfReadyForNpm();
      //#endregion

      //#region library pushing


      if (this.isStandaloneProject) {
        await this.standalone.bumpVersionInOtherProjects(newVersion, true)
      }

      this.commit(newVersion);

      this.packageJson.data.version = newVersion;
      this.packageJson.save('show for release')

      specyficProjectForBuild = await this.relaseBuild(newVersion, realCurrentProj, releaseOptions, false);

      if (this.isSmartContainer) {
        specyficProjectForBuild.smartcontainer.preparePackage(this, newVersion);
      }

      if (this.isStandaloneProject) {
        specyficProjectForBuild.standalone.preparePackage(this, newVersion);
      }

      if (this.isStandaloneProject) {
        this.standalone.fixPackageJson(realCurrentProj)
      }

      if (this.isStandaloneProject) {
        realCurrentProj.quickFixes.updateStanaloneProjectBeforePublishing(
          this,
          realCurrentProj,
          specyficProjectForBuild,
        );
      }

      if (!global.tnpNonInteractive) {
        await Helpers.questionYesNo(`Do you wanna check bundle folder before publishing ?`, async () => {
          specyficProjectForBuild.run(`code ${this.getTempProjName('bundle')}/${config.folder.node_modules}`).sync();
          Helpers.pressKeyAndContinue(`Check your compiled code and press any key ...`)
        });

      }

      if (this.isSmartContainer) {
        await specyficProjectForBuild.smartcontainer.publish({
          realCurrentProj,
          rootPackageName: `@${this.name}`,
          newVersion,
          automaticRelease,
          prod,
        })
      }

      if (this.isStandaloneProject) {
        await specyficProjectForBuild.standalone.publish({
          realCurrentProj,
          newVersion,
          automaticRelease,
          prod,
        });
      }

    }
    //#endregion



    if (!global.tnpNonInteractive || automaticReleaseDocs) {
      // Helpers.clearConsole();

      if (this.isStandaloneProject) {
        await this.standalone.buildDocs(prod, realCurrentProj, automaticReleaseDocs, async () => {
          specyficProjectForBuild = await this.relaseBuild(newVersion, realCurrentProj, releaseOptions, true);
        });
      }

      if (this.isSmartContainer) {
        await this.smartcontainer.buildDocs(prod, realCurrentProj, automaticReleaseDocs, async () => {
          specyficProjectForBuild = await this.relaseBuild(newVersion, realCurrentProj, releaseOptions, true);
        });
      }
    }


    const docsCwd = realCurrentProj.pathFor('docs');


    if (!automaticReleaseDocs && Helpers.exists(docsCwd)) {
      await this.infoBeforePublish(realCurrentProj, DEFAULT_PORT.BUNDLE_SERVER_DOCS);

    }

    await this.pushToGitRepo(realCurrentProj, newVersion, automaticReleaseDocs);
    if (!automaticReleaseDocs && Helpers.exists(docsCwd)) {
      await Helpers.killProcessByPort(DEFAULT_PORT.BUNDLE_SERVER_DOCS)
    }
    Helpers.info('RELEASE DONE');
    process.exit(0);
  }
  //#endregion

  private async infoBeforePublish(this: Project, realCurrentProj: Project, defaultTestPort: Number) {
    if (this.env.config?.useDomain) {
      Helpers.info(`Cannot local preview.. using doamin: ${this.env.config.domain}`)
      return;
    }
    const originPath = `http://localhost:`;
    const docsCwd = realCurrentProj.pathFor('docs');
    if (!Helpers.exists(docsCwd)) {
      return;
    }
    await Helpers.killProcessByPort(DEFAULT_PORT.BUNDLE_SERVER_DOCS)
    const commandHostLoclDocs = `firedev-http-server -s -p ${DEFAULT_PORT.BUNDLE_SERVER_DOCS} --base-dir ${this.name}`;

    // console.log({
    //   cwd, commandHostLoclDocs
    // })
    Helpers.run(commandHostLoclDocs, { cwd: docsCwd, output: false, silence: true }).async()
    if (this.isStandaloneProject) {
      Helpers.info(`Before pushing you can acces project here:

- ${originPath}${defaultTestPort}/${this.name}

`);
    }
    if (this.isSmartContainer) {
      const smartContainer = this;
      const mainProjectName = smartContainer.smartContainerBuildTarget.name
      const otherProjectNames = smartContainer
        .children
        .filter(c => c.name !== mainProjectName)
        .map(p => p.name);
      Helpers.info(`Before pushing you can acces projects here:

- ${originPath}${defaultTestPort}/${smartContainer.name}
${otherProjectNames.map(c => `- ${originPath}${defaultTestPort}/${smartContainer.name}/-/${c}`).join('\n')}

`);
    }


  }

  //#region  methods
  private async createTempProject(this: Project, releaseOptions?: Models.dev.ReleaseOptions, automaticRelease = false): Promise<boolean> {

    if (_.isUndefined(releaseOptions.useTempFolder)) {
      if (!this.checkIfReadyForNpm(true)) {
        Helpers.error(`Project "${this.name}" is not ready for npm release`, false, true)
      }
      // if (this.isPrivate) {
      //   Helpers.warn(`Cannot release private project ${chalk.bold(this.genericName)}`)
      //   return;
      // }
      if (this.targetProjects.exists) {
        if (global.tnpNonInteractive) {
          Helpers.warn(`Ommiting relese for project with "target projects"`);
          Helpers.sleep(3);
          return true;
        }
        Helpers.error(`You can't release project with target projects`, false, true);
      }
      releaseOptions.useTempFolder = true;
    }

    const baseFolder = path.join(this.location, 'tmp-bundle-release');
    const absolutePathReleaseProject = path.join(baseFolder, 'bundle', 'project', this.name);

    if (this.isStandaloneProject || this.isSmartContainer) {
      if (releaseOptions.useTempFolder) {

        Helpers.removeFolderIfExists(baseFolder);

        const browserFolder = path.join(this.location, config.folder.browser);

        if (!Helpers.exists(browserFolder)) {
          Helpers.remove(browserFolder);
        }

        const websqlFolder = path.join(this.location, config.folder.websql);

        if (!Helpers.exists(websqlFolder)) {
          Helpers.remove(websqlFolder);
        }

        Helpers.removeFolderIfExists(absolutePathReleaseProject);
        Helpers.mkdirp(absolutePathReleaseProject);
        this.copyManager.generateSourceCopyIn(absolutePathReleaseProject, {
          useTempLocation: true, // TODO not needed
          markAsGenerated: false, // TODO not needed
          forceCopyPackageJSON: true, // TODO not needed
          // @ts-ignore
          dereference: true,
          regenerateProjectChilds: this.isSmartContainer,
        });

        this.packageJson.linkTo(absolutePathReleaseProject);
        if (this.isStandaloneProject) {
          (this.env as any as EnvironmentConfig).coptyTo(absolutePathReleaseProject)
        }

        if (this.isSmartContainer) {
          const children = this.children;
          for (let index = 0; index < children.length; index++) {
            const child = children[index];
            (child.env as any as EnvironmentConfig).coptyTo(crossPlatformPath([absolutePathReleaseProject, child.name]))
          }

        }

        const generatedProject = Project.From(absolutePathReleaseProject) as Project;
        this.allResources.forEach(relPathResource => {
          const source = path.join(this.location, relPathResource);
          const dest = path.join(absolutePathReleaseProject, relPathResource);
          if (Helpers.exists(source)) {
            if (Helpers.isFolder(source)) {
              Helpers.copy(source, dest, { recursive: true });
            } else {
              Helpers.copyFile(source, dest);
            }
          }
        })

        // this.linkedRepos.linkToProject(generatedProject as Project)
        this.node_modules.linkToProject(generatedProject as Project);
        releaseOptions.useTempFolder = false;
        const vscodeFolder = path.join(generatedProject.location, config.folder._vscode);
        Helpers.removeFolderIfExists(vscodeFolder);
        await generatedProject.insideStructure.recrate('bundle')
        await generatedProject.release(releaseOptions);
        return true;
      }
    }
  }



  async relaseBuild(this: Project, newVersion: string, realCurrentProj: Project, releaseOptions: Models.dev.ReleaseOptions, forAppRelaseBuild: boolean) {
    const { prod, obscure, includeNodeModules, nodts, uglify, args } = releaseOptions;

    this.run(`${config.frameworkName} init ${this.isStandaloneProject ? '' : this.smartContainerBuildTarget.name}`).sync();
    const specyficProjectForBuild = this.isStandaloneProject ? this : Project.From(crossPlatformPath(path.join(
      this.location,
      config.folder.bundle,
      this.name,
      this.smartContainerBuildTarget.name,
    ))) as Project;

    // if (!this.node_modules.exist) {
    //   await this.npmPackages.installProcess(`release procedure`)
    // }

    const allArgs = args + ` ${!forAppRelaseBuild ? '--codeCutRelease=true' : ''} ${forAppRelaseBuild ? '--forAppRelaseBuild=true' : ''}`

    Helpers.logInfo(`BUILD OPTION (${this.name}):
    prod=${!!prod},
    obscure=${!!obscure},
    includeNodeModules=${!!includeNodeModules},
    nodts=${!!nodts},
    uglify=${!!uglify}
    allArgs: ${allArgs}
    `)

    await this.build(BuildProcess.prepareOptionsBuildProcess({
      prod,
      obscure,
      includeNodeModules,
      nodts,
      uglify,
      outDir: config.folder.bundle as 'bundle',
      args: allArgs,
    }, this) as any);


    // Helpers.move(browserBundle, websqlBundleTemp);
    // Helpers.move(browserBundleTemp, browserBundle);

    const bundles = [
      crossPlatformPath([specyficProjectForBuild.location, config.folder.bundle]),
      crossPlatformPath([specyficProjectForBuild.location, specyficProjectForBuild.getTempProjName('bundle'), config.folder.node_modules, realCurrentProj.name]),
    ];

    if (!specyficProjectForBuild.isCommandLineToolOnly) {
      for (let index = 0; index < bundles.length; index++) {
        const bundleFolder = bundles[index];
        specyficProjectForBuild.createClientVersionAsCopyOfBrowser(bundleFolder);
      }
    }

    for (let index = 0; index < bundles.length; index++) {
      const bundleFolder = bundles[index];
      specyficProjectForBuild.compileBrowserES5version(bundleFolder);
    }

    if (realCurrentProj.isStandaloneProject) {
      for (let index = 0; index < bundles.length; index++) {
        const bundleFolder = bundles[index];
        specyficProjectForBuild.bundleResources(bundleFolder);
      }
      specyficProjectForBuild.copyEssentialFilesTo(bundles, 'bundle');
    } else if (realCurrentProj.isSmartContainer) {
      const rootPackageName = `@${this.name}`;
      const base = path.join(
        specyficProjectForBuild.location,
        specyficProjectForBuild.getTempProjName('bundle'),
        config.folder.node_modules,
        rootPackageName,
      );
      const childrenPackages = Helpers.foldersFrom(base).map(f => path.basename(f))
      for (let index = 0; index < childrenPackages.length; index++) {
        const childName = childrenPackages[index];
        const child = Project.From([realCurrentProj.location, childName]) as Project;
        const bundleFolder = path.join(base, childName);
        child.bundleResources(bundleFolder);
      }
    }

    if(!forAppRelaseBuild) {
      this.commit(newVersion);
    }

    return specyficProjectForBuild;
  }


  protected async buildLib() {
    Helpers.log(`[buildLib] callend buildLib not implemented`)
  }

  protected copyEssentialFilesTo(this: Project, destinations: string[], outDir: Models.dev.BuildDir) {
    //
    this.copyWhenExist('bin', destinations);
    this.linkWhenExist(config.file.package_json, destinations);
    config.packageJsonSplit.forEach(c => {
      this.copyWhenExist(c, destinations);
    });
    this.copyWhenExist('.npmrc', destinations);
    this.copyWhenExist('.npmignore', destinations);
    this.copyWhenExist('.gitignore', destinations);
    if (this.typeIs('isomorphic-lib')) {
      this.copyWhenExist(config.file.tnpEnvironment_json, destinations);
    }
    if (outDir === 'bundle') {
      this.copyWhenExist(config.file.package_json, destinations);
      this.linkWhenExist(config.folder.node_modules, destinations);
      this.copyWhenExist('package.json', destinations.map(d => crossPlatformPath([d, config.folder.client])));
    }
  }

  /**
   * because of that
   * In vscode there is a mess..
   * TODO
   */
  removeJsMapsFrom(absPathBundleFolder: string) {
    return; // TODO not a good idea
    Helpers.filesFrom(absPathBundleFolder, true)
      .filter(f => f.endsWith('.js.map') || f.endsWith('.mjs.map'))
      .forEach(f => Helpers.removeFileIfExists(f));
  }

  getTempProjName(outdir: Models.dev.BuildDir) {
    const tempProjName = `tmp-local-copyto-proj-${outdir}`;
    return tempProjName;
  }


  private createClientVersionAsCopyOfBrowser(this: Project, bundleFolder: string) {
    //

    const browser = path.join(bundleFolder, config.folder.browser)
    const client = path.join(bundleFolder, config.folder.client)
    if (fse.existsSync(browser)) {
      Helpers.remove(client)
      Helpers.tryCopyFrom(browser, client);
    } else {
      Helpers.logWarn(`Browser folder not generated.. replacing with dummy files: browser.js, client.js`,
        false);
      const msg = `console.log('${this.genericName} only for backend') `;
      Helpers.writeFile(`${browser}.js`, msg);
      Helpers.writeFile(`${client}.js`, msg);
    }

  }

  public bundleResources(this: Project, bundleFolder: string) {
    //
    this.checkIfReadyForNpm()

    if (!fse.existsSync(bundleFolder)) {
      fse.mkdirSync(bundleFolder);
    }
    [].concat([
      ...this.resources,
      ...(this.isSmartContainerChild ? [config.file.package_json__tnp_json5] : []),
    ]).forEach(res => { //  copy resource to org build and copy shared assets
      const file = path.join(this.location, res);
      const dest = path.join(bundleFolder, res);
      if (!fse.existsSync(file)) {
        Helpers.error(`[${config.frameworkName}][lib-project] Resource file: ${chalk.bold(path.basename(file))} does not `
          + `exist in "${this.genericName}"  (package.json > resources[])
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
    Helpers.logInfo(`Resources copied to release folder: ${config.folder.bundle}`);

  }

  removeTagAndCommit(automaticRelease: boolean) {
    // Helpers.error(`PLEASE RUN: `, true, true);
    // if (!tagOnly) {
    //   Helpers.error(`git reset --hard HEAD~1`, true, true);
    // }
    Helpers.error(`'release problem... `, automaticRelease, true);
    // if (automaticRelease) {
    //   Helpers.error('release problem...', false, true);
    // }
  }

  // methods / project linked files
  projectLinkedFiles(this: Project): { sourceProject: Project, relativePath: string }[] {
    const files = [];
    return files;
  }


  // methods / create if not exists
  recreateIfNotExists() {
    return [];
  }


  // methods / project specify files
  projectSpecyficFiles(this: Project) {
    const files = [
      'index.js',
      'index.d.ts',
      'index.js.map',
    ];
    return files;
  }


  // methods / project specyfic files linked
  projectSpecyficFilesLinked(this: Project) {
    const files = [
    ];
    return files;
  }


  // methods / check if loggin in to npm
  private checkIfLogginInToNpm(this: Project) {
    //
    // if (!this.canBePublishToNpmRegistry) {
    //   return;
    // }
    try {
      this.run('npm whoami').sync();
    } catch (e) {
      Helpers.error(`Please login in to npm.`, false, true)
    }

  }


  // methods / copy when exists
  protected copyWhenExist(this: Project, relativePath: string, destinations: string[]) {

    const absPath = crossPlatformPath([this.location, relativePath]);

    for (let index = 0; index < destinations.length; index++) {
      const dest = crossPlatformPath([destinations[index], relativePath]);
      if (Helpers.exists(absPath)) {
        if (Helpers.isFolder(absPath)) {
          Helpers.remove(dest, true)
          Helpers.copy(absPath, dest, { recursive: true });
        } else {
          Helpers.copyFile(absPath, dest);
          if (path.basename(absPath) === config.file.tnpEnvironment_json) {
            Helpers.setValueToJSON(dest, 'currentProjectLocation', void 0);
          }
        }
      } else {
        Helpers.log(`[isomorphic-lib][copyWhenExist] not exists: ${absPath}`);
      }
    }


  }

  protected linkWhenExist(this: Project, relativePath: string, destinations: string[]) {

    let absPath = path.join(this.location, relativePath);

    if (Helpers.exists(absPath) && Helpers.isExistedSymlink(absPath)) {
      absPath = Helpers.pathFromLink(absPath);
    }

    for (let index = 0; index < destinations.length; index++) {
      const dest = crossPlatformPath([destinations[index], relativePath]);
      if (Helpers.exists(absPath)) {
        Helpers.remove(dest, true);
        Helpers.createSymLink(absPath, dest)
      }
    }
  }




  // methods / commit
  private commit(this: Project, newVer?: string, message = 'new version') {

    if (newVer) {
      this.git.commit(`${message} ${newVer}`);
    } else {
      this.git.commit('relese update')
    }


  }


  // methods / compile es5
  private compileBrowserES5version(this: Project, pathBundle: string) {
    //
    // TODO fix this for angular-lib
    if (this.frameworkVersionAtLeast('v3')) {
      return;
    }

    if (this.frameworkVersionEquals('v1') || this.typeIsNot('isomorphic-lib')) {
      return;
    }


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




  // methods / push to git repo
  async pushToGitRepo(this: Project, realCurrentProj: Project, newVersion?: string, pushWithoutAsking = false) {

    const push = async () => {
      if (newVersion) {
        const tagName = `v${newVersion}`;
        const commitMessage = ('new version ' + newVersion);
        try {
          realCurrentProj.run(`git tag -a ${tagName} `
            + `-m "${commitMessage}"`,
            { output: false }).sync();
        } catch (error) {
          Helpers.error(`Not able to tag project`, false, true);
        }
        const lastCommitHash = realCurrentProj.git.lastCommitHash();
        realCurrentProj.packageJson.setBuildHash(lastCommitHash);
        realCurrentProj.packageJson.save('updating hash');
        realCurrentProj.commit(newVersion, `build hash update`);
      } else {
        realCurrentProj.commit();
      }

      Helpers.log('Pushing to git repository... ')
      Helpers.log(`Git branch: ${realCurrentProj.git.currentBranchName}`);
      realCurrentProj.git.pushCurrentBranch();
      Helpers.info('Pushing to git repository done.');
    };

    if (pushWithoutAsking) {
      await push();
    } else {
      await Helpers.questionYesNo('Push changes to git repo ?', async () => {
        await push();
      });
    }
  }
  //#endregion

}

//
