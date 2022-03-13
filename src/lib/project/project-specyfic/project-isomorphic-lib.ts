//#region @backend
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import { glob } from 'tnp-core';
import * as inquirer from 'inquirer';
import { config, ConfigModels } from 'tnp-config';
import { IncrementalBuildProcessExtended } from '../compilers/build-isomorphic-lib/incremental-build-process.backend';
import { RegionRemover } from '../compilers/build-isomorphic-lib/region-remover.backend';
//#endregion
import { Project } from '../abstract/project/project';
import { _ } from 'tnp-core';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { BuildOptions } from 'tnp-db';
import { CLASS } from 'typescript-class-helpers';
const loadNvm = 'export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use v14';

//#region @backend
@CLASS.NAME('ProjectIsomorphicLib')
//#endregion
export class ProjectIsomorphicLib
  //#region @backend
  extends Project
//#endregion
{

  async initProcedure() {
    //#region @backend
    if (this.isCoreProject && this.frameworkVersionAtLeast('v2')) {

    }
    //#endregion
  }

  startOnCommand(args: string) {
    //#region @backendFunc
    const command = `ts-node run.js ${args}`;
    return command;
    //#endregion
  }

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

  get ignoreInV3() {
    const files = [
      'angular.json.filetemplate',
      'ngsw-config.json.filetemplate',
      'tsconfig.ng.json.filetemplate'
    ];
    return [
      ...files,
      ...files.map(f => f.replace('.filetemplate', '')),
    ]
  }

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
      files = files.filter(f => !this.ignoreInV3.includes(f))
    }

    return files;
    //#endregion
  }



  filesTemplates() {
    //#region @backendFunc
    let files = [
      'tsconfig.json.filetemplate',
    ];

    if (this.frameworkVersionAtLeast('v2')) {
      files = [
        'tsconfig.isomorphic.json.filetemplate',
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

  projectSpecyficIgnoredFiles() {
    //#region @backendFunc
    return [
      'src/entities.ts',
      'src/controllers.ts'
    ].concat(this.projectSpecyficFiles());
    //#endregion
  }

  //#region @backend
  public static angularProjProxyPath(
    project: Project,
    outFolder?: ConfigModels.OutFolder,
    client?: string,
    type: 'app' | 'lib' = 'app'
  ) {
    const pref = ((type === 'app') ? 'apps' : 'libs')

    const tmpProjectsStandalone = `tmp-${pref}-for-{{{outFolder}}}/${project.name}`;
    const tmpProjects = `tmp-${pref}-for-{{{outFolder}}}/${project.name}--for--{{{client}}}`;
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

  private proxyNgProj(project: Project, buildOptions: BuildOptions, type: 'app' | 'lib' = 'app') {
    //#region @backendFunc
    const projepath = path.join(this.location, ProjectIsomorphicLib.angularProjProxyPath(
      project,
      buildOptions.outDir as any,
      void 0, // TODO
      type
    ));
    const proj = Project.From(projepath);
    return proj as Project;
    //#endregion
  }


  private async buildApp(
    //#region @backend
    outDir: Models.dev.BuildDir,
    watch: boolean,
    forClient: Project[] | string[],
    args: string,
    baseHref: string,
    prod: boolean,
    //#endregion
  ) {
    //#region @backend

    //#region prepare baseHref
    if (baseHref) {
      baseHref = `${baseHref}/`;
      baseHref = baseHref.replace(/\/\//g, '/')
    }
    baseHref = this.isStandaloneProject ? `base-href ${this.name}` : (baseHref ? `base-href ${baseHref}` : '');
    baseHref = `--${baseHref}`;
    //#endregion

    let webpackEnvParams = `--env.outFolder=${outDir}`;
    webpackEnvParams = webpackEnvParams + (watch ? ' --env.watch=true' : '');

    const outPutPathCommand = `--output-path ../../${this.isStandaloneProject
      ? config.folder.docs
      : config.folder.previewDistApp} ${baseHref}`;

    let { flags } = require('minimist')(args.split(' '));
    flags = (_.isString(flags) ? [flags] : []);
    flags = (!_.isArray(flags) ? [] : flags);

    // TODO ?
    // const statsCommand = (!this.isStandaloneProject ? (
    //   this.env.config.name === 'static' ? '--stats-json' : ''
    // ) : '');

    let client = _.first(forClient as Project[]);

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

    let command: string;

    if (this.frameworkVersionAtLeast('v3')) {
      const portToServe = _.isNumber(port) ? `--port=${port}` : '';
      const aot = flags.includes('aot');
      const ngBuildCmd = `${loadNvm} && npm-run ng build `
        + `${aot ? '--aot=true' : ''} `
        + `${prod ? '--prod' : ''} `
        + `${watch ? '--watch' : ''}`
        + `${outPutPathCommand} `

      if (watch) {
        if (outDir === 'dist') {
          command = `${loadNvm} && npm-run ng serve ${portToServe} ${prod ? '--prod' : ''}`;
        } else {
          command = ngBuildCmd;
        }
      } else {
        command = ngBuildCmd;
      }
    } else {
      if (_.isNumber(port)) {
        webpackEnvParams = `${webpackEnvParams} --env.port=${port}`;
      }
      command = `npm-run webpack-dev-server ${webpackEnvParams}`;
    }

    let proj: Project;
    if (this.frameworkVersionAtLeast('v3')) {
      proj = this.proxyNgProj(this, this.buildOptions);
    } else {
      proj = this;
    }

    Helpers.info(`

      ANGULAR COMMAND: ${command}

      inside: ${proj.location}

      `)

    proj.run(command).sync();

    //#endregion
  }

  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backendFunc
    const { prod, watch, outDir, onlyWatchNoBuild, appBuild, args, forClient = [], baseHref } = buildOptions;

    if (!onlyWatchNoBuild) {
      if (appBuild) {
        await this.buildApp(outDir, watch, forClient as any, buildOptions.args, baseHref, prod);
      } else {
        await this.buildLib();
      }
    }
    return;
    //#endregion
  }

  //#region @backend
  cutReleaseCode() {
    if (!(path.basename(path.dirname(path.dirname(this.location))) === config.folder.bundle &&
      path.basename(path.dirname(this.location)) === config.folder.project)) {
      Helpers.warn(`Npm code cut available only for command: ${config.frameworkName} release`);
      return;
    }

    const releaseSrcLocation = path.join(this.location, config.folder.src);
    const filesForModyficaiton = glob.sync(`${releaseSrcLocation}/**/*`);
    filesForModyficaiton
      .filter(absolutePath => !Helpers.isFolder(absolutePath))
      .forEach(absolutePath => {
        let rawContent = Helpers.readFile(absolutePath);
        rawContent = RegionRemover.from(absolutePath, rawContent, ['@notForNpm'], this.project).output;
        // rawContent = this.replaceRegionsWith(rawContent, ['@notForNpm']);
        Helpers.writeFile(absolutePath, rawContent);
      });
  }

  //#endregion

  fixBuildDirs(outDir: Models.dev.BuildDir) {
    const p = path.join(this.location, outDir);
    if (!Helpers.isFolder(p)) {
      Helpers.remove(p);
      Helpers.mkdirp(p);
    }
  }

  async buildLib() {
    //#region @backend
    const { outDir, ngbuildonly, watch } = this.buildOptions;

    this.fixBuildDirs(outDir);

    Helpers.log(`[buildLib] start of building`);
    this.beforeLibBuild(outDir);


    const { obscure, uglify, nodts } = this.buildOptions;
    if (outDir === 'bundle') {
      this.cutReleaseCode();
    }

    if (outDir === 'bundle' && (obscure || uglify)) {
      this.quickFixes.overritenBadNpmPackages();
    }


    const angularCommand = `${loadNvm} && npm-run ng build ${this.name} ${watch ? '--watch' : ''}`;
    Helpers.info(`

        ANGULAR 13+ ${this.buildOptions.watch ? 'WATCH ' : ''} LIB BUILD STARTED...

        command: ${angularCommand}

        `);

    const webpackCommandFn = (watchCommand: boolean) =>
      `npx webpack@3.10.0 --config webpack.backend-bundle-build.js ${watchCommand ? '--watch -env=useUglify' : ''}`;

    const webpackCommand = webpackCommandFn(this.buildOptions.watch);

    Helpers.info(`

        WEBPACK ${this.buildOptions.watch ? 'WATCH ' : ''
      } BACKEND BUILD started...

        command: ${webpackCommand}

        `);



    if (!this.buildOptions.watch && (uglify || obscure || nodts) && outDir === 'bundle') {
      this.buildOptions.genOnlyClientCode = true;
    }
    this.incrementalBuildProcess = new IncrementalBuildProcessExtended(this, this.buildOptions);

    const proxyProject = this.proxyNgProj(this, this.buildOptions, 'lib');

    Helpers.log(`

    proxy Proj = ${proxyProject?.location}

    `)

    if (this.buildOptions.watch) {
      //#region watch build
      if (outDir === 'bundle') {
        // Helpers.error(`Watch build not available for bundle build`, false, true);
        Helpers.info(`Starting watch bundle build for fast cli..`);
        try {
          this.run(webpackCommand).async();
        } catch (er) {
          Helpers.error(`WATCH BUNDLE build failed`, false, true);
        }
      }
      await this.incrementalBuildProcess.startAndWatch('isomorphic compilation (watch mode)',
        {
          watchOnly: this.buildOptions.watchOnly,
          afterInitCallBack: async () => {
            await this.compilerCache.setUpdatoDate.incrementalBuildProcess();
          }
        });
      if (this.frameworkVersionAtLeast('v3')) { // TOOD @LAST
        await proxyProject.run(angularCommand).unitlOutputContains('Compilation complete. Watching for file changes')
      }

      //#endregion
    } else {

      if (outDir === 'bundle' && (obscure || uglify || nodts)) {
        try {
          this.run(webpackCommand).sync();
        } catch (er) {
          Helpers.error(`BUNDLE (single file compilation) build failed`, false, true);
        }
        await this.browserCodePreventer.start('browser code preventer');

        try {
          if (obscure || uglify) {
            this.backendCompileToEs5();
          }
          if (uglify) {
            this.backendUglifyCode(config.reservedArgumentsNamesUglify)
          };
          if (obscure) {
            this.backendObscureCode(config.reservedArgumentsNamesUglify);
          }
          if (!nodts) {
            this.backendCompilerDeclarationFiles()
          };
          // process.exit(0)
        } catch (er) {
          Helpers.error(`BUNDLE (obscure || uglify || nodts) process failed`, false, true);
        }
        await this.incrementalBuildProcess.start('isomorphic compilation (only browser) ')
        await proxyProject.run(angularCommand).sync()

      } else {
        await this.incrementalBuildProcess.start('isomorphic compilation');
        await proxyProject.run(angularCommand).sync()
        await this.browserCodePreventer.start('browser code preventer');
      }

    }

    //#endregion
  }

  backendCompilerDeclarationFiles() {
    //#region @backend
    this.run(`npm-run tsc --emitDeclarationOnly --declarationDir ${config.folder.bundle}`).sync();
    //#endregion
  }

  //#region @backend
  backendCompileToEs5() {
    if (!Helpers.exists(path.join(this.location, config.folder.bundle, 'index.js'))) {
      Helpers.warn(`[compileToEs5] Nothing to compile to es5... no index.js in bundle`)
      return;
    }
    const indexEs5js = `index-es5.js`;
    Helpers.writeFile(path.join(this.location, config.folder.bundle, config.file._babelrc), '{ "presets": ["env"] }\n');
    this.run(`npm-run babel  ./bundle/index.js --out-file ./bundle/${indexEs5js}`).sync();
    Helpers.writeFile(
      path.join(this.location, config.folder.bundle, config.file.index_js),
      Helpers.readFile(path.join(this.location, config.folder.bundle, indexEs5js))
    );
    Helpers.removeFileIfExists(path.join(this.location, config.folder.bundle, indexEs5js));
    Helpers.removeFileIfExists(path.join(this.location, config.folder.bundle, config.file._babelrc));
  }
  //#endregion

  backendUglifyCode(reservedNames: string[]) {
    //#region @backendFunc
    if (!Helpers.exists(path.join(this.location, config.folder.bundle, 'index.js'))) {
      Helpers.warn(`[uglifyCode] Nothing to uglify... no index.js in bundle`)
      return
    }
    const command = `npm-run uglifyjs bundle/index.js --output bundle/index.js`
      + ` --mangle reserved=[${reservedNames.map(n => `'${n}'`).join(',')}]`
    // + ` --mangle-props reserved=[${reservedNames.join(',')}]` // it breakes code

    Helpers.info(`

    JAVASCRIPT-UGLIFY PROCESSING...

    ${command}

      `)
    this.run(command).sync();
    //#endregion
  }

  backendObscureCode(reservedNames: string[]) {
    //#region @backendFunc
    if (!Helpers.exists(path.join(this.location, config.folder.bundle, 'index.js'))) {
      Helpers.warn(`[obscureCode] Nothing to obscure... no index.js in bundle`)
      return
    }
    const commnad = `npm-run javascript-obfuscator bundle/index.js `
      + ` --output bundle/index.js`
      + ` --target node`
      + ` --rotate-string-array true`
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
