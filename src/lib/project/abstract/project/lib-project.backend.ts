//#region imports
import { BuildProcessFeature, EnvironmentConfig } from '../../features';
import { crossPlatformPath, fse } from 'tnp-core/src'
import { path } from 'tnp-core/src'
import { glob } from 'tnp-core/src';
import * as getDependents from 'npm-get-dependents';
import chalk from 'chalk';
import { Project } from './project';
import { _ } from 'tnp-core/src';
import { Models } from 'tnp-models/src';
import { Helpers } from 'tnp-helpers/src';
import { config } from 'tnp-config/src';
import { Log } from 'ng2-logger/src';
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

  //#region  fields & getters / is global system tool
  // @ts-ignore
  get isGlobalSystemTool(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isGlobalSystemTool;
    }
    return this.packageJson && this.packageJson.isGlobalSystemTool;
  }
  //#endregion

  //#region  fields & getters / is command line tools only
  // @ts-ignore
  get isCommandLineToolOnly(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isCommandLineToolOnly;
    }
    return this.packageJson && this.packageJson.isCommandLineToolOnly;
  }
  //#endregion

  //#region  fields & getters / is in release dist
  // @ts-ignore
  get isInRelaseDist(this: Project) {
    return this.location.includes('tmp-dist-release/dist');
  };
  //#endregion

  //#region  fields & getters / angular core app files
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

  //#endregion

  //#region release

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
      } else {
        realCurrentProj.quickFixes.updateContainerProjectBeforePublishing(
          this,
          realCurrentProj,
          specyficProjectForBuild,
        );
      }

      let publish = true;

      if (!global.tnpNonInteractive) {
        await Helpers.questionYesNo(`Do you wanna check compiled version before publishing ?`, async () => {
          specyficProjectForBuild.run(`code ${this.getTempProjName('dist')}/${config.folder.node_modules}`).sync();
          Helpers.pressKeyAndContinue(`Check your compiled code and press any key ...`)
        });
      }

      publish = await Helpers.questionYesNo(`Publish this package ?`);

      if (publish) {
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
      } else {
        Helpers.info('Omitting npm publish...')
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
      await this.infoBeforePublish(realCurrentProj, DEFAULT_PORT.DIST_SERVER_DOCS);

    }

    await this.pushToGitRepo(realCurrentProj, newVersion, automaticReleaseDocs);
    if (!automaticReleaseDocs && Helpers.exists(docsCwd)) {
      await Helpers.killProcessByPort(DEFAULT_PORT.DIST_SERVER_DOCS)
    }
    Helpers.info('RELEASE DONE');
    process.exit(0);
  }
  //#endregion

  //#region  methods

  //#region  methods / lib project init
  // @ts-ignore
  libProjectInit(this: Project) {
    this.standalone = new LibProjectStandalone(this as any);
    this.smartcontainer = new LibProjectSmartContainer(this as any);
    this.vscodext = new LibProjectVscodeExt(this as any);
  }
  //#endregion

  //#region methods / info before publish
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
    await Helpers.killProcessByPort(DEFAULT_PORT.DIST_SERVER_DOCS)
    const commandHostLoclDocs = `firedev-http-server -s -p ${DEFAULT_PORT.DIST_SERVER_DOCS} --base-dir ${this.name}`;

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
  //#endregion

  //#region methods / create temp project
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

    const baseFolder = path.join(this.location, config.folder.tmpDistRelease);
    const absolutePathReleaseProject = path.join(baseFolder, config.folder.dist, 'project', this.name);

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
          forceCopyPackageJSON: true, // TODO not needed
          // @ts-ignore
          dereference: true,
          regenerateProjectChilds: this.isSmartContainer,
        });

        this.packageJson.linkTo(absolutePathReleaseProject);
        if (this.isStandaloneProject) {
          await this.env.init();
          (this.env as any as EnvironmentConfig).coptyTo(absolutePathReleaseProject)
        }

        if (this.isSmartContainer) {
          const children = this.children;
          for (let index = 0; index < children.length; index++) {
            const child = children[index] as Project;
            await child.env.init();
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
        await generatedProject.insideStructure.recrate('dist')
        await generatedProject.release(releaseOptions);
        return true;
      }
    }
  }
  //#endregion

  //#region methods / release build
  async relaseBuild(this: Project, newVersion: string, realCurrentProj: Project, releaseOptions: Models.dev.ReleaseOptions, forAppRelaseBuild: boolean) {
    const { prod, obscure, includeNodeModules, nodts, uglify, args } = releaseOptions;

    this.run(`${config.frameworkName} init ${this.isStandaloneProject ? '' : this.smartContainerBuildTarget.name}`).sync();
    const specyficProjectForBuild = this.isStandaloneProject ? this : Project.From(crossPlatformPath(path.join(
      this.location,
      config.folder.dist,
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

    await this.build(BuildProcessFeature.prepareOptionsBuildProcess({
      prod,
      obscure,
      includeNodeModules,
      nodts,
      uglify,
      outDir: config.folder.dist as 'dist',
      args: allArgs,
    }, this) as any);


    // Helpers.move(browserDist, websqlDistTemp);
    // Helpers.move(browserDistTemp, browserDist);

    const dists = [
      crossPlatformPath([specyficProjectForBuild.location, config.folder.dist]),
      crossPlatformPath([specyficProjectForBuild.location,
      specyficProjectForBuild.getTempProjName('dist'),
      config.folder.node_modules, realCurrentProj.name]),
    ];

    if (!specyficProjectForBuild.isCommandLineToolOnly && realCurrentProj.isStandaloneProject) {
      for (let index = 0; index < dists.length; index++) {
        const releaseDistFolder = dists[index];
        specyficProjectForBuild.createClientVersionAsCopyOfBrowser(releaseDistFolder);
      }
    }

    for (let index = 0; index < dists.length; index++) {
      const releaseDist = dists[index];
      specyficProjectForBuild.compileBrowserES5version(releaseDist);
    }

    if (realCurrentProj.isStandaloneProject) {
      for (let index = 0; index < dists.length; index++) {
        const releaseDist = dists[index];
        specyficProjectForBuild.packReleaseDistResources(releaseDist);
      }
      specyficProjectForBuild.copyEssentialFilesTo(dists, 'dist');
    } else if (realCurrentProj.isSmartContainer) {
      const rootPackageName = `@${this.name}`;
      const base = path.join(
        specyficProjectForBuild.location,
        specyficProjectForBuild.getTempProjName('dist'),
        config.folder.node_modules,
        rootPackageName,
      );
      const childrenPackages = Helpers.foldersFrom(base).map(f => path.basename(f))
      for (let index = 0; index < childrenPackages.length; index++) {
        const childName = childrenPackages[index];
        const child = Project.From([realCurrentProj.location, childName]) as Project;
        const releaseDistFolder = path.join(base, childName);
        child.packReleaseDistResources(releaseDistFolder);
      }
    }

    if (!forAppRelaseBuild) {
      this.commit(newVersion);
    }

    return specyficProjectForBuild;
  }
  //#endregion

  //#region methods / build lib placeholder
  protected async buildLib() {
    Helpers.log(`[buildLib] callend buildLib not implemented`)
  }
  //#endregion

  //#region methods / copy essential files
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

    if (this.isInRelaseDist) { // @LAST probably something else
      this.copyWhenExist(config.file.package_json, destinations);
      this.linkWhenExist(config.folder.node_modules, destinations);
      this.copyWhenExist('package.json', destinations.map(d => crossPlatformPath([d, config.folder.client])));
    }
  }
  //#endregion

  //#region methods / remove (m)js.map files from release
  /**
   * because of that
   * In vscode there is a mess..
   * TODO
   */
  removeJsMapsFrom(absPathReleaseDistFolder: string) {
    return; // TODO not a good idea
    Helpers.filesFrom(absPathReleaseDistFolder, true)
      .filter(f => f.endsWith('.js.map') || f.endsWith('.mjs.map'))
      .forEach(f => Helpers.removeFileIfExists(f));
  }
  //#endregion

  //#region methods / get temp project name
  getTempProjName(outdir: Models.dev.BuildDir) {
    const tempProjName = `tmp-local-copyto-proj-${outdir}`;
    return tempProjName;
  }
  //#endregion

  //#region methods / create /client folder from /browser folder
  private createClientVersionAsCopyOfBrowser(this: Project, releaseDistFolder: string) {
    //

    const browser = path.join(releaseDistFolder, config.folder.browser)
    const client = path.join(releaseDistFolder, config.folder.client)
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
  //#endregion

  //#region methods / pack resources
  public packReleaseDistResources(this: Project, releaseDistFolder: string) {
    //
    this.checkIfReadyForNpm()

    if (!fse.existsSync(releaseDistFolder)) {
      fse.mkdirSync(releaseDistFolder);
    }
    [].concat([
      ...this.resources,
      ...(this.isSmartContainerChild ? [
        config.file._npmignore,
        config.file.package_json__tnp_json5
      ] : [
        config.file._npmignore,
      ]),
    ]).forEach(res => { //  copy resource to org build and copy shared assets
      const file = path.join(this.location, res);
      const dest = path.join(releaseDistFolder, res);
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
    Helpers.logInfo(`Resources copied to release folder: ${config.folder.dist}`);

  }
  //#endregion

  //#region methods / remove tag nad commit
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
  //#endregion

  //#region methods / project linked files placeholder
  projectLinkedFiles(this: Project): { sourceProject: Project, relativePath: string }[] {
    const files = [];
    return files;
  }
  //#endregion

  //#region methods / recreate if not exits placeholder
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
  //#endregion

  //#region methods / copy when exists
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
  //#endregion

  //#region methods / link when exists
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
  //#endregion

  //#region methods / commit
  private commit(this: Project, newVer?: string, message = 'new version') {

    if (newVer) {
      this.git.commit(`${message} ${newVer}`);
    } else {
      this.git.commit('relese update')
    }
  }
  //#endregion

  //#region methods / compile es5
  private compileBrowserES5version(this: Project, pathReleaseDist: string) {
    //
    // TODO fix this for angular-lib
    if (this.frameworkVersionAtLeast('v3')) {
      return;
    }

    if (this.frameworkVersionEquals('v1') || this.typeIsNot('isomorphic-lib')) {
      return;
    }


    const cwdBrowser = path.join(pathReleaseDist, config.folder.browser);
    const cwdClient = path.join(pathReleaseDist, config.folder.client);
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
  //#endregion

  //#region methods / push to git repo
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

  //#endregion
}

//
