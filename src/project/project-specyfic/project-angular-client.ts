//#region @backend
import * as path from 'path';
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as child from 'child_process';
import { config } from 'tnp-config';
import { Project } from '../abstract';
//#endregion
import { Helpers } from 'tnp-helpers';
import { BuildOptions } from 'tnp-db';
import { Models } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';

/**
 * DO NOT USE environment variables in this project directly
 */
//#region @backend
@CLASS.NAME('ProjectAngularClient')
//#endregion
export class ProjectAngularClient
  //#region @backend
  extends Project
//#endregion
{
  async buildLib() { }

  get isEjectedProject() {
    //#region @backendFunc
    return this.typeIs('angular-client')
    //#endregion
  }

  filesTemplates() {
    //#region @backendFunc
    return [
      'src/tsconfig.app.json.filetemplate',
      'webpack.config.build.aot.js.filetemplate',
      'webpack.config.build.js.filetemplate',
      'webpack.config.common.js.filetemplate',
      'webpack.config.js.filetemplate',
      '.angular-cli.json.filetemplate'
    ];
    //#endregion
  }

  projectSpecyficFiles() {
    //#region @backendFunc
    return [
      'tsconfig.json',
      ...(!this.isStandaloneProject ? [
        'src/typings.d.ts',
      ] : []),
      'src/main.ts',
      'src/polyfills.ts',
      'src/tsconfig.spec.json',
      'src/tsconfig.app.json',
      'protractor.conf.js',
      'karma.conf.js',
      ...this.filesTemplates()
        .filter(f => f !== 'src/tsconfig.app.json.filetemplate')
    ].concat(this.isEjectedProject ? [
      'webpack.config.build.aot.js',
      'webpack.config.build.js',
      'webpack.config.common.js',
      'webpack.config.js'
    ] : []);
    //#endregion
  }

  preventWarningTypescirptMismatch() {
    //#region @backendFunc
    this.run('npm-run ng set warnings.typescriptMismatch=false').sync()
    //#endregion
  }

  startOnCommand(args: string) {
    //#region @backendFunc
    const baseUrl = this.env.config && this.env.config.workspace.projects.find(({ name }) => name === this.name).baseUrl;
    const command = `tnp serve --port ${this.getDefaultPort()} --outDir ${config.folder.previewDistApp} --baseUrl ${baseUrl} ${args}`;
    // console.log(`Angular command: ${command}`)
    return command;
    //#endregion
  }

  async buildApp(watch = false, prod: boolean, port?: number, baseHref?: string, flags: string[] = [], args?: string) {
    //#region @backendFunc
    const outDirApp = 'dist-app';
    const argsAdditionalParams: { port: number; } = Helpers.cliTool.argsFrom(args) || {} as any;
    if (watch) {
      const portNumber = (argsAdditionalParams.port && this.isStandaloneProject)
        ? argsAdditionalParams.port : (port !== undefined ? port : void 0);

      const p = _.isNumber(portNumber) ? `--port=${argsAdditionalParams.port}` : '';
      let command: string;
      if (this.isEjectedProject) {
        await Helpers.killProcessByPort(port)
        command = `npm-run webpack-dev-server  --host 0.0.0.0 ${p} `;
      } else {
        command = `npm-run ng serve ${p} --aot=false`;
      }
      Helpers.info(`

      ANGULAR SERVE COMMAND: ${command}

      `)
      this.run(command, { biggerBuffer: true }).async()
    } else {
      baseHref = this.isStandaloneProject ? `base-href ${this.name}` : (baseHref ? `base-href ${baseHref}` : '')
      if (this.isEjectedProject) {
        baseHref = `--env.${baseHref}`
        const aot = (prod ? 'aot.' : '');
        // const stats = [
        //   "--display-chunks false",
        //   "--display-optimization-bailout false",
        //   "--display-provided-exports false',
        //   "--display-used-exports false',
        //   "--display-depth false",
        //   "--display-reasons false",
        //   "--display-cached-assets false",
        //   "--display-cached false",
        //   "--display-origins false",
        //   "--display-entrypoints false",
        //   "--display-max-modules false",
        //   "--display-modules false",
        //   "--display-exclude true",
        //   "--verbose  false",
        //   "--progress false",
        //   "--hide-modules true",
        //   "--display none"
        // ]
        Helpers.tryRemoveDir(path.join(this.location, outDirApp));
        this.run(`npm-run webpack --config=webpack.config.build.${aot}js ${baseHref}`,
          {
            output: (this.env.config.name === 'local'),
            silence: (this.env.config.name !== 'local'),
            biggerBuffer: true
          }).sync();
      } else {

        baseHref = `--${baseHref}`

        if (prod) {
          Helpers.info(`BUILDING PRODUCTION`)
        }
        let command: string;
        const statsCommand = (!this.isStandaloneProject ? (
          this.env.config.name === 'static' ? '--stats-json' : ''
        ) : '');
        const outPutPathCommand = `--output-path ${this.isStandaloneProject ? config.folder.docs : config.folder.previewDistApp} ${baseHref}`;

        if (this.frameworkVersionEquals('v1')) {
          command = `npm-run ng build  ${statsCommand} `
            + ` --aot=false ${prod ? '-prod' : ''} ${outPutPathCommand}`
        } else {
          const aot = flags.includes('aot')
          command = `npm-run ng build  ${statsCommand} --serviceWorker=true `
            + ` --aot=${aot ? 'true' : 'false --build-optimizer=false'} ${prod ? '--prod' : ''} ${outPutPathCommand}`
        }

        Helpers.info(`

Angular cli build command: ${command}

        `)

        try {
          const showOutput = this.isStandaloneProject ? true : (['local', 'static'] as Models.env.EnvironmentName[])
            .includes(this.env.config.name);
          this.run(command,
            {
              output: showOutput,
              silence: !showOutput,
              biggerBuffer: true
            }).sync()
        } catch (e) {
          Helpers.error(e, true, true);
          Helpers.error(`Build app from lib command failed: ${command}`, false, true);
        }

      }
    }
    //#endregion
  }

  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backendFunc
    this.buildOptions = buildOptions;
    const { prod, watch, outDir, appBuild, args } = buildOptions;
    if (this.isEjectedProject) {
      this.preventWarningTypescirptMismatch()
    }
    if (appBuild) {
      let baseHref = buildOptions.baseHref;
      if (baseHref) {
        baseHref = `${baseHref}/`;
        baseHref = baseHref.replace(/\/\//g, '/')
      }
      let { flags } = require('minimist')(args.split(' '));
      flags = (_.isString(flags) ? [flags] : []);
      flags = (!_.isArray(flags) ? [] : flags);
      await this.buildApp(watch, prod, this.getDefaultPort(), baseHref && baseHref, flags, buildOptions.args);
    }
    //#endregion
  }

}
