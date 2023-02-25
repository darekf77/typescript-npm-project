//#region imports
//#region @backend
import { crossPlatformPath, ExecuteOptions, fse } from 'tnp-core'
import { path } from 'tnp-core'
import { glob } from 'tnp-core';
import * as inquirer from 'inquirer';
import { config, ConfigModels } from 'tnp-config';
import { RegionRemover } from 'isomorphic-region-loader';
import { IncrementalBuildProcess } from '../compilers/build-isomorphic-lib/compilations/incremental-build-process.backend';
import { PackagesRecognition } from '../features/package-recognition/packages-recognition';
//#endregion
import { Project } from '../abstract/project/project';
import { _ } from 'tnp-core';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { BuildOptions } from 'tnp-db';
import { CLASS } from 'typescript-class-helpers';
import { CLI } from 'tnp-cli';
//#endregion

//#region consts
// const loadNvm = ''// 'echo ' // 'export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use v14';
//#endregion
@CLASS.NAME('ProjectIsomorphicLib')
export class ProjectIsomorphicLib
  //#region @backend
  extends Project
//#endregion
{
  //#region static

  //#region static / get angular project proxy path
  //#region @backend
  public static angularProjProxyPath(
    project: Project,
    outFolder?: ConfigModels.OutFolder,
    client?: string,
    websql?: boolean,
    type: 'app' | 'lib' = 'app'
  ) {
    const pref = ((type === 'app') ? 'apps' : 'libs')

    const tmpProjectsStandalone = `tmp-${pref}-for-{{{outFolder}}}${websql ? '-websql' : ''}/${project.name}`;
    const tmpProjects = `tmp-${pref}-for-{{{outFolder}}}${websql ? '-websql' : ''}/${project.name}--for--{{{client}}}`;
    if (project.isStandaloneProject) {
      if (outFolder) {
        return tmpProjectsStandalone.replace('{{{outFolder}}}', outFolder);
      }
      return tmpProjectsStandalone;
    }
    if (outFolder && client) {
      return tmpProjects.replace('{{{outFolder}}}', outFolder).replace('{{{client}}}', client);
    }
    return tmpProjects;
  }
  //#endregion
  //#endregion

  //#endregion

  //#region fields / getters
  private npmRunNg = `npm-run ng`; // when there is not globl "ng" command -> npm-run ng.js works

  get ignoreInV3() {
    const files = [
      'angular.json.filetemplate',
      'ngsw-config.json.filetemplate',
    ];
    return [
      ...files,
      ...files.map(f => f.replace('.filetemplate', '')),
    ]
  }

  get isInRelaseBundle() {
    return this.location.includes('tmp-bundle-release/bundle');
  };

  //#endregion

  //#region methods

  //#region methods / source files to ignore
  sourceFilesToIgnore() {
    //#region @backendFunc
    let toIgnore = [
      `src/${config.file.entities_ts}`,
      `src/${config.file.controllers_ts}`,
    ];
    if (this.isSiteInStrictMode) {
      toIgnore = toIgnore.concat(toIgnore.map(f => `${config.folder.custom}/${f}`))
    }
    return toIgnore;
    //#endregion
  }
  //#endregion

  //#region methods / project specyfic files
  projectSpecyficFiles(): string[] {
    //#region @backendFunc
    let files = super.projectSpecyficFiles()
      .concat([
        'tsconfig.browser.json',
        'webpack.config.js',
        'webpack.backend-bundle-build.js',
        'run.js',
        ...this.filesTemplates(),
      ]).concat(
        !this.isStandaloneProject ? [
          'src/typings.d.ts',
        ] : []);

    if (this.frameworkVersionAtLeast('v2')) {
      files = files.filter(f => f !== 'tsconfig.browser.json');
    }

    if (this.frameworkVersionAtLeast('v3')) {
      files = files.filter(f => !this.ignoreInV3.includes(f));
    }

    return files;
    //#endregion
  }
  //#endregion

  //#region methods / files templates
  filesTemplates() {
    //#region @backendFunc
    let files = [
      'tsconfig.json.filetemplate',
      'tsconfig.backend.dist.json.filetemplate',
      'tsconfig.backend.bundle.json.filetemplate',
    ];

    if (this.frameworkVersionAtLeast('v2')) {
      files = [
        'tsconfig.isomorphic.json.filetemplate',
        'tsconfig.isomorphic-flat-dist.json.filetemplate',
        'tsconfig.isomorphic-flat-bundle.json.filetemplate',
        'tsconfig.browser.json.filetemplate',
        ...this.vscodeFileTemplates,
        ...files,
      ];
    }

    if (this.frameworkVersionAtLeast('v3')) {
      files = files.filter(f => !this.ignoreInV3.includes(f))
    }

    return files;
    //#endregion
  }
  //#endregion

  //#region methods / project linked files
  projectLinkedFiles() {
    //#region @backendFunc
    const files = super.projectLinkedFiles();

    if (this.frameworkVersionAtLeast('v2')) {
      files.push({
        sourceProject: Project.by<Project>(this._type, 'v1'),
        relativePath: 'webpack.backend-bundle-build.js'
      });
    }

    return files;
    //#endregion
  }
  //#endregion

  //#region methods / project specyfic ignored files
  projectSpecyficIgnoredFiles() {
    //#region @backendFunc
    return [
      'src/entities.ts',
      'src/controllers.ts'
    ].concat(this.projectSpecyficFiles());
    //#endregion
  }
  //#endregion

  //#region methods / build steps
  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backendFunc
    this.buildOptions = buildOptions;
    const { prod, watch, outDir, onlyWatchNoBuild, appBuild, args, forClient = [], baseHref, websql } = buildOptions;

    if (!onlyWatchNoBuild) {
      if (appBuild) {
        await this.buildApp(outDir, watch, forClient as any, buildOptions.args, baseHref, prod, websql);
      } else {
        await this.buildLib();
      }
    }

    //#endregion
  }
  //#endregion

  //#endregion

  //#region api

  //#region api / init procedure
  async initProcedure() {
    //#region @backend
    if (this.isCoreProject && this.frameworkVersionAtLeast('v2')) {

    }
    //#endregion
  }
  //#endregion

  //#region api / start on command

  startOnCommand(args: string) {
    //#region @backendFunc
    const command = `ts-node run.js ${args}`;
    return command;
    //#endregion
  }
  //#endregion

  //#region api / build app
  async buildApp(
    //#region options
    //#region @backend
    outDir: Models.dev.BuildDir,
    watch: boolean,
    forClient: Project[] | string[],
    args: string,
    baseHref: string,
    prod: boolean,
    websql: boolean,
    //#endregion
    //#endregion
  ) {
    //#region @backend

    //#region prepare variables

    //#region prepare variables / baseHref

    let basename = ''
    if (this.isInRelaseBundle) {
      basename = `--base-href /${this.isSmartContainerTarget ? this.smartContainerTargetParentContainer.name : this.name}/`;
    }

    //#endregion

    //#region prepare variables / webpack params
    let webpackEnvParams = `--env.outFolder=${outDir}`;
    webpackEnvParams = webpackEnvParams + (watch ? ' --env.watch=true' : '');


    const backAppTmpFolders = `../../`;
    const backeFromRelase = `../../../../`;
    const backeFromContainerTarget = `../../../`;
    let back = backAppTmpFolders;
    if (this.isInRelaseBundle) {
      if (this.isSmartContainerTarget) {
        back = `${backAppTmpFolders}${backeFromContainerTarget}${backeFromRelase}`;
      } else {
        back = `${backAppTmpFolders}${backeFromRelase}`;
      }
    } else {
      if (this.isSmartContainerTarget) {
        back = `${backAppTmpFolders}${backeFromContainerTarget}`;
      }
    }

    const outDirApp = this.isInRelaseBundle ? config.folder.docs : `${outDir}-app${websql ? '-websql' : ''}`;

    const outPutPathCommand = `--output-path ${back}${outDirApp} ${basename}`;

    let { flags } = require('minimist')(args.split(' '));
    flags = (_.isString(flags) ? [flags] : []);
    flags = (!_.isArray(flags) ? [] : flags);
    //#endregion

    //#region prepare variables / general variables

    // TODO ?
    // const statsCommand = (!this.isStandaloneProject ? (
    //   this.env.config.name === 'static' ? '--stats-json' : ''
    // ) : '');

    let client = _.first(forClient as Project[]);
    let port: number;
    if (client) {
      port = client.getDefaultPort();
      webpackEnvParams = `${webpackEnvParams} --env.moduleName=${client.name}`;
    }

    const argsAdditionalParams: { port: number; } = Helpers.cliTool.argsFrom(args) || {} as any;
    if (_.isNumber(argsAdditionalParams.port)) {
      port = argsAdditionalParams.port;
    }
    if (_.isNumber(port)) {
      await Helpers.killProcessByPort(port);
    }

    const isStandalone = (this.isStandaloneProject
      && !this.isWorkspaceChildProject
      && !this.isSmartContainerTarget
    );
    // console.log({ isStandalone, 'this.name': this.name });

    const buildOutDir = this.buildOptions.outDir;
    const parent = (!isStandalone
      ? (this.isSmartContainerTarget ? this.smartContainerTargetParentContainer : this.parent)
      : void 0
    );

    const additionalReplace = (line: string) => {
      const beforeModule2 = crossPlatformPath(path.join(
        buildOutDir,
        parent.name,
        this.name,
        `tmp-apps-for-${buildOutDir}/${this.name}`
      ));

      // console.log({ beforeModule2 })

      if (line.search(beforeModule2) !== -1) {
        line = line.replace(beforeModule2 + '/', '')
      }

      return line
    };
    //#endregion

    //#region prepare variables / command
    let command: string;
    if (this.frameworkVersionAtLeast('v3')) {
      //#region prepare angular variables for new v3 inside structure build
      const portToServe = _.isNumber(port) ? `--port=${port}` : '';
      const aot = flags.includes('aot');
      // const ngBuildCmd = // TODO LOAD NVME HERE
      const ngBuildCmd = `npm-run ng build `
        + `${aot ? '--aot=true' : ''} `
        + `${prod ? '--prod' : ''} `
        + `${watch ? '--watch' : ''}`
        + `${outPutPathCommand} `

      if (watch) {
        if (outDir === 'dist') {
          // command = `${loadNvm} && ${this.npmRunNg} serve ${portToServe} ${prod ? '--prod' : ''}`;
          command = `${this.npmRunNg} serve ${portToServe} ${prod ? '--prod' : ''}`;
        } else {
          command = ngBuildCmd;
        }
      } else {
        command = ngBuildCmd;
      }
      //#endregion
    } else {
      //#region @deprecated prepare webpack variables
      if (_.isNumber(port)) {
        webpackEnvParams = `${webpackEnvParams} --env.port=${port}`;
      }
      command = `npm-run webpack-dev-server ${webpackEnvParams}`;
      //#endregion
    }
    //#endregion

    //#region prepare variables / @depracated  workspace simulated app
    if (!global.tnpNonInteractive) {
      if (!this.isStandaloneProject && forClient.length === 0) {
        const answer: { project: string } = await inquirer
          .prompt([
            {
              type: 'list',
              name: 'project',
              message: 'Which project do you wanna simulate ?',
              choices: this.parent.children
                .filter(c => c.typeIs(...config.allowedTypes.app))
                .filter(c => c.name !== this.name)
                .map(c => c.name),
              filter: function (val) {
                return val.toLowerCase();
              }
            }
          ]) as any;
        client = Project.From<Project>(path.join(this.location, '..', answer.project));
      }
    }
    //#endregion

    //#region prepare variables / proper project variable
    let proj: Project;
    if (this.frameworkVersionAtLeast('v3')) {
      proj = this.proxyNgProj(this, this.buildOptions);
    } else {
      proj = this;
    }
    //#endregion

    //#region prepare variables / angular info
    const showInfoAngular = () => {
      Helpers.log(`

  ANGULAR BUILD APP COMMAND: ${command}

  inside: ${proj.location}

  `);
    };
    //#endregion

    //#endregion

    showInfoAngular();

    await proj.execute(command, {
      //#region command execute params
      exitOnError: true,
      exitOnErrorCallback: async (code) => {
        Helpers.error(`[${config.frameworkName}] Typescript compilation error (code=${code})`
          , false, true);
      },
      outputLineReplace: (line: string) => {
        //#region replace outut line for better debugging
        if (isStandalone) {
          return line.replace(
            `src/app/${this.name}/`,
            `./src/`
          );
        } else {
          line = line.trim();

          if (line.search('src/app/') !== -1) {
            line = line.replace('src/app/', './src/app/');
            line = line.replace('././src/app/', './src/app/');
          }

          if (line.search(`src/app/${this.name}/libs/`) !== -1) {
            const [__, ___, ____, _____, ______, moduleName] = line.split('/');
            return additionalReplace(line.replace(
              `src/app/${this.name}/libs/${moduleName}/`,
              `${moduleName}/src/lib/`,
            ));
          }

          if (line.search(`src/app/`) !== -1) {
            const [__, ___, ____, moduleName] = line.split('/');
            return additionalReplace(line.replace(
              `src/app/${moduleName}/`,
              `${moduleName}/src/`,
            ));
          }
          return additionalReplace(line);
        }
        //#endregion
      },
      //#endregion
    });
    //#endregion
  }
  //#endregion

  //#region api / build lib
  async buildLib() {
    //#region @backend

    //#region preparing variables

    //#region preparing variables & fixing things
    const { outDir, ngbuildonly, watch, args } = this.buildOptions;

    this.fixBuildDirs(outDir);

    // Helpers.info(`[buildLib] start of building ${websql ? '[WEBSQL]' : ''}`);
    Helpers.log(`[buildLib] start of building...`);
    this.beforeLibBuild(outDir);

    const { codeCutRelease } = require('minimist')((args || '').split(' '));

    const { obscure, uglify, nodts, includeNodeModules } = this.buildOptions;
    const productionModeButIncludePackageJsonDeps = (obscure || uglify) && !includeNodeModules;


    if (outDir === 'bundle' && (obscure || uglify)) {
      this.quickFixes.overritenBadNpmPackages();
    }

    if (productionModeButIncludePackageJsonDeps) {
      this.buildOptions.genOnlyClientCode = true;
    }
    //#endregion

    //#region preparing variables / incremental build
    const incrementalBuildProcess = new IncrementalBuildProcess(this, this.buildOptions.clone({
      websql: false
    }));

    const incrementalBuildProcessWebsql = new IncrementalBuildProcess(this, this.buildOptions.clone({
      websql: true,
      genOnlyClientCode: true,
    }));

    const proxyProject = this.proxyNgProj(this, this.buildOptions.clone({
      websql: false,
    }), 'lib');

    const proxyProjectWebsql = this.proxyNgProj(this, this.buildOptions.clone({
      websql: true
    }), 'lib');

    Helpers.log(`

    proxy Proj = ${proxyProject?.location}
    proxy Proj websql = ${proxyProjectWebsql?.location}

    `);



    // const webPack1 = `require('webpack')`;
    // const webPack2 = `require('${this.npmPackages.global('webpack', true)}')`;
    // const fileWEbpack = path.join(this.location, 'webpack.backend-bundle-build.js')
    // const fileContent = Helpers.readFile(fileWEbpack).replace(webPack1, webPack2);
    // Helpers.writeFile(fileWEbpack, fileContent);
    //#endregion

    //#region preparing variables / general
    const isStandalone = (!this.isWorkspace || !this.isSmartContainer);

    const sharedOptions = () => {
      return {
        exitOnError: true,
        exitOnErrorCallback: async (code) => {
          Helpers.error(`[${config.frameworkName}] Typescript compilation lib error (code=${code})`
            , false, true);
        },
        outputLineReplace: (line: string) => {
          if (isStandalone) {
            return line.replace(
              `projects/${this.name}/src/`,
              `./src/`
            );
          }
          return line;
        },
      } as ExecuteOptions;
    };
    //#endregion

    //#region prepare variables / command
    // const command = `${loadNvm} && ${this.npmRunNg} build ${this.name} ${watch ? '--watch' : ''}`;
    const command = `${this.npmRunNg} build ${this.name} ${watch ? '--watch' : ''}`;
    //#endregion

    //#region prepare variables / angular info
    const showInfoAngular = () => {
      Helpers.info(`Starting browser Angular/TypeScirpt build.... ${this.buildOptions.websql ? '[WEBSQL]' : ''}`);
      Helpers.log(`

      ANGULAR 13+ ${this.buildOptions.watch ? 'WATCH ' : ''} LIB BUILD STARTED... ${this.buildOptions.websql ? '[WEBSQL]' : ''}

      `);

      Helpers.log(` command: ${command}`);
    };
    //#endregion

    //#endregion

    if (this.buildOptions.watch) {
      if (productionModeButIncludePackageJsonDeps) {
        //#region webpack bundle build
        await incrementalBuildProcess.startAndWatch(`isomorphic compilation (only browser) `);
        await incrementalBuildProcessWebsql.startAndWatch(`isomorphic compilation (only browser) [WEBSQL]`);
        // Helpers.error(`Watch build not available for bundle build`, false, true);
        // Helpers.info(`Starting watch bundle build for fast cli.. ${this.buildOptions.websql ? '[WEBSQL]' : ''}`);
        Helpers.info(`Starting watch bundle build for fast cli.. `);

        try {
          await this.webpackBackendBuild.run({
            appBuild: false,
            outDir,
            watch,
          });
        } catch (er) {
          Helpers.error(`WATCH ${outDir.toUpperCase()} build failed`, false, true);
        }
        //#endregion
      } else {
        //#region watch backend compilation
        await incrementalBuildProcess.startAndWatch('isomorphic compilation (watch mode)',
          //#region options
          {
            watchOnly: this.buildOptions.watchOnly,
            afterInitCallBack: async () => {
              await this.compilerCache.setUpdatoDate.incrementalBuildProcess();
            }
          }
          //#endregion
        );

        await incrementalBuildProcessWebsql.startAndWatch('isomorphic compilation (watch mode) [WEBSQL]',
          //#region options
          {
            watchOnly: this.buildOptions.watchOnly,
            afterInitCallBack: async () => {
              await this.compilerCache.setUpdatoDate.incrementalBuildProcess();
            }
          }
          //#endregion
        );

        if (this.frameworkVersionAtLeast('v3')) { // TOOD
          showInfoAngular()

          if (isStandalone || (this.isSmartContainerTarget && this.buildOptions.copyto?.length > 0)) {
            if (this.isSmartContainerTarget) { // TODO QUICK_FIX this should be in init/struct
              PackagesRecognition.fromProject(this).start(true, 'before startling lib proxy project');
            }
            await proxyProject.execute(command, {
              resolvePromiseMsg: {
                stdout: 'Compilation complete. Watching for file changes'
              },
              ...sharedOptions(),
            });
            await proxyProjectWebsql.execute(command, {
              resolvePromiseMsg: {
                stdout: 'Compilation complete. Watching for file changes'
              },
              ...sharedOptions(),
            });
          }
          this.showMesageWhenBuildLibDoneForSmartContainer(args, watch, this.isInRelaseBundle);
        }
        //#endregion
      }
    } else {
      if (codeCutRelease) {
        this.cutReleaseCode();
      }
      //#region non watch build
      if (productionModeButIncludePackageJsonDeps) {
        //#region release production backend build for firedev/tnp specyfic
        // console.log('k1')
        await incrementalBuildProcess.start('isomorphic compilation (only browser) ');
        await incrementalBuildProcessWebsql.start('isomorphic compilation (only browser) [WEBSQL] ');

        try {
          await this.webpackBackendBuild.run({
            appBuild: false,
            outDir,
            watch,
          });
        } catch (er) {
          Helpers.error(`${outDir.toUpperCase()} (single file compilation) build failed`, false, true);
        }

        if (nodts) {
          //#region fix webpack dt
          const baseDistGenWebpackDts = crossPlatformPath(path.join(this.location, outDir, 'dist'));
          Helpers
            .filesFrom(baseDistGenWebpackDts, true)
            .forEach(absSource => {
              const destDtsFile = path.join(
                this.location,
                outDir,
                absSource.replace(`${baseDistGenWebpackDts}/`, '')
              );
              Helpers.copyFile(absSource, destDtsFile);
            });
        }
        Helpers.removeIfExists(path.join(this.location, outDir, 'dist'));

        try {
          if (obscure || uglify) {
            this.backendCompileToEs5(outDir);
          }
          if (uglify) {
            this.backendUglifyCode(outDir, config.reservedArgumentsNamesUglify)
          };
          if (obscure) {
            this.backendObscureCode(outDir, config.reservedArgumentsNamesUglify);
          }
          // process.exit(0)
        } catch (er) {
          Helpers.error(`${outDir.toUpperCase()} (obscure || uglify) process failed`, false, true);
        }

        try {
          showInfoAngular()
          await proxyProject.execute(command, {
            ...sharedOptions()
          })
          await proxyProjectWebsql.execute(command, {
            ...sharedOptions()
          })
        } catch (e) {
          Helpers.log(e)
          Helpers.error(`
          Command failed: ${command}

          Not able to build project: ${this.genericName}`, false, true)
        }
        //#endregion
      } else {
        //#region normal backend compilation

        await incrementalBuildProcess.start('isomorphic compilation');
        await incrementalBuildProcessWebsql.start('isomorphic compilation');

        try {
          showInfoAngular();
          await proxyProject.execute(command, {
            ...sharedOptions(),
          });
          await proxyProjectWebsql.execute(command, {
            ...sharedOptions(),
          });
          this.showMesageWhenBuildLibDoneForSmartContainer(args, watch, this.isInRelaseBundle);
        } catch (e) {
          Helpers.log(e)
          Helpers.error(`
          Command failed: ${command}

          Not able to build project: ${this.genericName}`, false, true)
        }

        //#endregion
      }

      if (includeNodeModules) {
        const cliJsFile = 'cli.js';
        this.backendIncludeNodeModulesInCompilation(
          outDir,
          false, // uglify,
          cliJsFile,
        );
        if (uglify) {
          this.backendUglifyCode(outDir, config.reservedArgumentsNamesUglify, cliJsFile)
        };
        if (!productionModeButIncludePackageJsonDeps) {
          if (obscure || uglify) {
            this.backendCompileToEs5(outDir, cliJsFile);
          }
          if (obscure) {
            this.backendObscureCode(outDir, config.reservedArgumentsNamesUglify, cliJsFile);
          }
        }
      }

      if (nodts) {
        this.backendRemoveDts(outDir);
      }

      //#endregion
      if (codeCutRelease) {
        this.cutReleaseCodeRestore();
      }
    }



    //#endregion
  }
  //#endregion

  //#endregion

  //#region private methods

  //#region private methods / show message when build lib done for smart container
  private showMesageWhenBuildLibDoneForSmartContainer(args: string, watch: boolean, isInRelease: boolean) {
    if (isInRelease) {
      Helpers.info('Release lib build done.');
      return;
    }
    const buildLibDone = `LIB BUILD DONE.. `;
    const ifapp = 'if you want to start app build -> please run in other terminal command:';
    const ngserve = `${watch ? '--port 4201 # or whatever port' : '#'} to run angular ${watch
      ? 'ng serve'
      : 'ng build (for application - not lib)'
      }.`;
    const bawOrba = watch ? 'baw' : 'ba';
    const bawOrbaLong = watch ? ' build:app:watch ' : ' build:app ';
    const bawOrbaLongWebsql = watch ? 'build:app:watch --websql' : 'build:app --websql';
    const withPort = '(with port)';
    const orIfWebsql = `or if you want to try websql mode:`;



    if (this.isSmartContainerTarget) {
      const parent = this.smartContainerTargetParentContainer;
      args = Helpers.cliTool.removeArgFromString(args);
      const target = (crossPlatformPath(_.first(args.split(' '))) || '').replace('/', '');

      Helpers.taskDone(`${CLI.chalk.underline(`

      ${buildLibDone}... for target project "`
        + `${parent ? (parent.name + '/') : ''}${target}"`)}`)

      Helpers.success(`

      ${ifapp}

      ${CLI.chalk.bold(config.frameworkName + bawOrbaLong + target)}
      or
      ${config.frameworkName} ${bawOrba} ${target}

      ${withPort}
      ${config.frameworkName} ${bawOrba} ${target} ${ngserve}

      ${orIfWebsql}
      ${config.frameworkName} ${bawOrbaLongWebsql}

            `);
    } else if (this.isStandaloneProject) {
      Helpers.taskDone(`${CLI.chalk.underline(`${buildLibDone}...`)}`)
      Helpers.success(`

      ${ifapp}

      ${CLI.chalk.bold(config.frameworkName + bawOrbaLong)}
      or
      ${config.frameworkName} ${bawOrba}

      ${withPort}
      ${config.frameworkName} ${bawOrba} ${ngserve}

      ${orIfWebsql}
      ${bawOrbaLongWebsql}

      `);
    }

  }
  //#endregion

  //#region private methods / fix build dirs
  private fixBuildDirs(outDir: Models.dev.BuildDir) {
    //#region @backend
    const p = path.join(this.location, outDir);
    if (!Helpers.isFolder(p)) {
      Helpers.remove(p);
      Helpers.mkdirp(p);
    }
    //#endregion
  }
  //#endregion

  //#region private methods / get proxy ng projects
  private proxyNgProj(project: Project, buildOptions: BuildOptions, type: 'app' | 'lib' = 'app') {
    //#region @backendFunc
    const projepath = crossPlatformPath(path.join(this.location, ProjectIsomorphicLib.angularProjProxyPath(
      project,
      buildOptions.outDir as any,
      void 0, // TODO
      buildOptions.websql,
      type
    )));
    const proj = Project.From(projepath);
    return proj as Project;
    //#endregion
  }
  //#endregion

  //#region private methods / compile backend declaration files
  private backendCompilerDeclarationFiles(outDir: Models.dev.BuildDir) {
    //#region @backend
    this.run(`npm-run tsc --emitDeclarationOnly --declarationDir ${outDir}`).sync();
    //#endregion
  }
  //#endregion

  //#region private methods / include node_modules in compilation
  private backendRemoveDts(outDir: Models.dev.BuildDir) {
    Helpers
      .filesFrom([this.location, outDir, 'lib'], true)
      .filter(f => f.endsWith('.d.ts'))
      .forEach(f => Helpers.removeFileIfExists(f))
      ;
    Helpers.writeFile([this.location, outDir, 'lib/index.d.ts'], `export declare const dummy${(new Date()).getTime()};`);
  }
  //#endregion

  //#region private methods / include node_modules in compilation
  private backendIncludeNodeModulesInCompilation(outDir: Models.dev.BuildDir, uglify: boolean, mainCliJSFileName: string = config.file.index_js) {
    //#region @backend

    // QUICK_FIX TODO ncc input change does not work (it takes always index.js)
    //#region QUICK_FIX
    const indexOrg = this.pathFor(`${outDir}/${config.file.index_js}`);
    const indexOrgBackup = this.pathFor(`${outDir}/${config.file.index_js}-backup`);
    if (mainCliJSFileName !== config.file.index_js) {
      Helpers.copyFile(indexOrg, indexOrgBackup);
    }
    //#endregion

    const nccComand = `ncc build ${outDir}/${mainCliJSFileName} -o ${outDir}/temp/ncc ${uglify ? '-m' : ''}  --no-cache `;
    // console.log({
    //   nccComand
    // })
    this.run(nccComand).sync();
    Helpers
      .filesFrom([this.location, outDir, 'lib'], true)
      .filter(f => f.endsWith('.js') || f.endsWith('.js.map'))
      .forEach(f => Helpers.removeFileIfExists(f))
      ;

    const baseBundleOrDist = crossPlatformPath(path.join(this.location, outDir));
    const nccBase = crossPlatformPath(path.join(this.location, outDir, 'temp', 'ncc'));

    Helpers
      .filesFrom(nccBase, true)
      .filter(f => f.replace(`${nccBase}/`, '') !== config.file.package_json)
      .forEach(f => {
        const relativePath = f.replace(`${nccBase}/`, '');
        const dest = crossPlatformPath(path.join(baseBundleOrDist, relativePath));
        Helpers.copyFile(f, dest);
      });

    Helpers.removeFolderIfExists(path.dirname(nccBase));

    // remove dependencies
    const pjPath = this.pathFor(`${outDir}/${config.file.package_json}`);
    const pj: Models.npm.IPackageJSON = Helpers.readJson(pjPath);
    Object.keys(pj.dependencies).forEach(name => {
      if (!['ora'].includes(name)) { // TODO QUICK FIX FOF TNP
        delete pj.dependencies[name];
      } // @LAST
    })
    pj.peerDependencies = {};
    pj.devDependencies = {};
    Helpers.removeFileIfExists(pjPath);
    Helpers.writeFile(pjPath, pj);

    if (mainCliJSFileName !== config.file.index_js) {
      Helpers.copyFile(indexOrg, mainCliJSFileName);
      Helpers.copyFile(indexOrgBackup, indexOrg);
    }

    //#endregion
  }
  //#endregion

  //#region private methods / compile backend es5
  /**
   * TODO not working
   */
  private backendCompileToEs5(outDir: Models.dev.BuildDir, mainCliJSFileName = 'index.js') {
    return;
    //#region @backend
    if (!Helpers.exists(path.join(this.location, outDir, 'index.js'))) {
      Helpers.warn(`[compileToEs5] Nothing to compile to es5... no index.js in ${outDir}`)
      return;
    }
    const indexEs5js = `index-es5.js`;
    Helpers.writeFile(path.join(this.location, outDir, config.file._babelrc), '{ "presets": ["env"] }\n');
    this.run(`npm-run babel  ./${outDir}/index.js --out-file ./${outDir}/${indexEs5js}`).sync();
    Helpers.writeFile(
      path.join(this.location, outDir, config.file.index_js),
      Helpers.readFile(path.join(this.location, outDir, indexEs5js))
    );
    Helpers.removeFileIfExists(path.join(this.location, outDir, indexEs5js));
    Helpers.removeFileIfExists(path.join(this.location, outDir, config.file._babelrc));
    //#endregion
  }
  //#endregion

  //#region private methods / compile/uglify backend code
  private backendUglifyCode(outDir: Models.dev.BuildDir, reservedNames: string[], mainCliJSFileName = 'index.js') {
    //#region @backendFunc
    if (!Helpers.exists(path.join(this.location, outDir, mainCliJSFileName))) {
      Helpers.warn(`[uglifyCode] Nothing to uglify... no ${mainCliJSFileName} in /${outDir}`)
      return
    }
    const command = `npm-run uglifyjs ${outDir}/${mainCliJSFileName} --output ${outDir}/${mainCliJSFileName} -b`
      + ` --mangle reserved=[${reservedNames.map(n => `'${n}'`).join(',')}]`
    // + ` --mangle-props reserved=[${reservedNames.join(',')}]` // it breakes code

    Helpers.info(`

    JAVASCRIPT-UGLIFY PROCESSING...

    ${command}

      `)
    this.run(command).sync();
    //#endregion
  }
  //#endregion

  //#region private methods / compile/obscure backend code
  private backendObscureCode(outDir: Models.dev.BuildDir, reservedNames: string[], mainCliJSFileName = 'index.js') {
    //#region @backendFunc
    if (!Helpers.exists(path.join(this.location, config.folder.bundle, mainCliJSFileName))) {
      Helpers.warn(`[obscureCode] Nothing to obscure... no ${mainCliJSFileName} in bundle`)
      return
    }
    const commnad = `npm-run javascript-obfuscator bundle/${mainCliJSFileName} `
      + ` --output bundle/${mainCliJSFileName}`
      + ` --target node`
      + ` --string-array-rotate true`
      // + ` --stringArray true`
      + ` --string-array-encoding base64`
      + ` --reserved-names '${reservedNames.join(',')}'`
      + ` --reserved-strings '${reservedNames.join(',')}'`

    Helpers.info(`

        JAVASCRIPT-OBFUSCATOR PROCESSING...

        ${commnad}

          `)
    this.run(commnad).sync();
    //#endregion
  }
  //#endregion

  //#region private methods / cut release code

  private get tmpSrcBundleFolder() {
    return `tmp-cut-relase-src-${config.folder.bundle}${this.buildOptions.websql ? '-websql' : ''}`
  }

  private cutReleaseCodeRestore() {
    //#region @backend
    const releaseSrcLocation = crossPlatformPath(path.join(this.location, config.folder.src));
    const releaseSrcLocationOrg = crossPlatformPath(path.join(this.location, this.tmpSrcBundleFolder));

    Helpers.removeFolderIfExists(releaseSrcLocation);
    Helpers.copy(releaseSrcLocationOrg, releaseSrcLocation);

    //#endregion
  }

  private cutReleaseCode() {
    //#region @backend
    const releaseSrcLocation = crossPlatformPath(path.join(this.location, config.folder.src));
    const releaseSrcLocationOrg = crossPlatformPath(path.join(this.location, this.tmpSrcBundleFolder));
    Helpers.removeFolderIfExists(releaseSrcLocationOrg);
    Helpers.copy(releaseSrcLocation, releaseSrcLocationOrg, { copySymlinksAsFiles: true, recursive: true });
    Helpers.removeFolderIfExists(releaseSrcLocation);
    Helpers.copy(releaseSrcLocationOrg, releaseSrcLocation);

    const filesForModyficaiton = glob.sync(`${releaseSrcLocation}/**/*`);
    filesForModyficaiton
      .filter(absolutePath => !Helpers.isFolder(absolutePath))
      .forEach(absolutePath => {
        // console.log({
        //   absolutePath
        // })
        let rawContent = Helpers.readFile(absolutePath);
        rawContent = RegionRemover.from(absolutePath, rawContent, ['@notFor' + 'Npm'], this.project).output;
        // rawContent = this.replaceRegionsWith(rawContent, ['@notFor'+'Npm']);
        Helpers.writeFile(absolutePath, rawContent);
      });
    //#endregion
  }
  //#endregion

  //#endregion
}

//#region @backend
export function getReservedClassNames(project = Project.Current as Project) {
  // console.log('get class names from : ' + project.name)
  // console.log('parent : ' + (project.parent && project.parent.name))
  // console.log('childeren' + (project.parent && project.parent.children.map(c => c.name)));
  // console.log('children isomorphic: ' + (project.parent && project.parent.children
  //     .filter((p) => p.type === 'isomorphic-lib')
  //     .map(c => c.name))
  // );
  if (project && project.parent && project.parent.typeIs('workspace')
    && Array.isArray(project.parent.children)
    && project.parent.children.length > 0) {


    const names = []
    project.parent.children
      .filter((p) => p.typeIs('isomorphic-lib'))
      .forEach(p => {

        const controllers = Helpers.morphi.getControllers(path.join(
          p.location,
          config.folder.src
        ))

        // console.log('controllers', controllers)
        controllers.forEach(c => {
          names.push(path.basename(c, '.ts'))
        });

        const entities = Helpers.morphi.getEntites(path.join(
          p.location,
          config.folder.src
        ))
        // const entities = glob.sync(`${path.join(
        //   p.location,
        //   config.folder.src,
        //   config.folder.entities
        // )}/**/*.ts`)
        // console.log('entities', entities)
        entities.forEach(e => {
          names.push(path.basename(e, '.ts'))
        });
      })
    return names;
  }
  return [];
}
//#endregion
