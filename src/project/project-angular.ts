//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as child from 'child_process';
// third part
import { Project } from "./base-project";
import { error } from "../messages";
import config from "../config";
import { BuildOptions } from '../models';
import { EnvironmentConfig } from './environment-config';

/**
 * DO NOT USE environment variables in this project directly
 */
export class AngularProject extends Project {


  get isEjectedProject() {
    try {
      const file = fs.readFileSync(path.join(this.location, '.angular-cli.json')).toString()
      const config: { project: { ejected: boolean; } } = JSON.parse(file);
      return (config.project && config.project.ejected);
    } catch (e) {
      error(e)
    }
  }


  projectSpecyficFiles() {
    return [
      "tsconfig.json",
      'src/typings.d.ts',
      'src/main.ts',
      'src/polyfills.ts',
      'src/tsconfig.app.json',
      'src/tsconfig.spec.json',
      'protractor.conf.js',
      'karma.conf.js'
    ].concat(this.isEjectedProject ? [
      'webpack.config.build.aot.js',
      'webpack.config.build.js',
      'webpack.config.common.js',
      'webpack.config.js'
    ] : [])
  }

  preventWarningTypescirptMismatch() {
    this.run('npm-run ng set warnings.typescriptMismatch=false').sync()
  }

  startOnCommand(args: string) {

    const baseUrl = this.env.config.workspace.projects.find(({ name }) => name === this.name).baseUrl;
    const command = `tnp serve --port ${this.getDefaultPort()} --outDir ${config.folder.previewDistApp} --baseUrl ${baseUrl} ${args}`;
    // console.log(`Angular command: ${command}`)
    return command;
  }

  buildApp(watch = false, prod: boolean, port?: number, baseHref?: string) {
    const outDirApp = 'dist-app';
    if (watch) {
      const p = (port !== undefined ? `--port ${port}` : '');
      if (this.isEjectedProject) {
        this.run(`npm-run webpack-dev-server ${p} `, { biggerBuffer: true }).async()
      } else {
        this.run(`npm-run ng serve ${p} `, { biggerBuffer: true }).async()
      }
    } else {
      baseHref = baseHref ? `base-href ${baseHref}` : ''
      if (this.isEjectedProject) {
        baseHref = `--env.${baseHref}`
        const aot = (prod ? 'aot.' : '');
        // const stats = [
        //   "--display-chunks false",
        //   "--display-optimization-bailout false",
        //   "--display-provided-exports false",
        //   "--display-used-exports false",
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

        this.run(`rimraf ${outDirApp} && npm-run webpack --config=webpack.config.build.${aot}js ${baseHref}`,
          {
            output: (this.env.config.name === 'local'),
            silence: (this.env.config.name !== 'local'),
            biggerBuffer: true
          }).sync()
        // child.execSync(`rimraf ${outDirApp} && npm-run webpack --config=webpack.config.build.${aot}js ${baseHref}`, {
        //   stdio: 'ignore'
        // })

      } else {
        baseHref = `--${baseHref}`
        this.run(`npm-run ng build --output-path ${config.folder.previewDistApp} ${baseHref}`,
          {
            output: (this.env.config.name === 'local'),
            silence: (this.env.config.name !== 'local'),
            biggerBuffer: true
          }).sync()
      }
    }

  }

  async buildSteps(buildOptions?: BuildOptions) {
    this.buildOptions = buildOptions;
    const { prod, watch, outDir, appBuild, args } = buildOptions;
    let baseHref = buildOptions.baseHref;
    if (this.isEjectedProject) {
      this.preventWarningTypescirptMismatch()
    }
    if (appBuild) {
      if (baseHref) {
        baseHref = `${baseHref}/`;
        baseHref = baseHref.replace(/\/\//g, '/')
      }
      this.buildApp(watch, prod, this.getDefaultPort(), baseHref && baseHref);
    }
  }

}
//#endregion
