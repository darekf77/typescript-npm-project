import * as path from 'path';
import * as fs from 'fs';
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
    this.run('tnp npm-run ng set warnings.typescriptMismatch=false').sync()
  }

  startOnCommand() {

    const baseUrl = this.env.configFor.backend.workspace.projects.find(({ name }) => name === this.name).baseUrl;
    const command = `tnp serve --port ${this.getDefaultPort()} --outDir ${config.folder.previewDistApp} --baseUrl ${baseUrl}`;
    console.log(`Angular command: ${command}`)
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
        this.run(`tnp rimraf ${outDirApp} && npm-run webpack --config=webpack.config.build.${aot}js ${baseHref}`, { biggerBuffer: true }).sync()
      } else {
        baseHref = `--${baseHref}`
        this.run(`npm-run ng build --output-path ${config.folder.previewDistApp} ${baseHref}`, { biggerBuffer: true }).sync()
      }
    }

  }

  buildSteps(buildOptions?: BuildOptions) {
    this.buildOptions = buildOptions;
    const { prod, watch, outDir, appBuild, baseHref } = buildOptions;
    if (this.isEjectedProject) {
      this.preventWarningTypescirptMismatch()
    }
    if (appBuild) {
      this.buildApp(watch, prod, this.getDefaultPort(), baseHref && `${baseHref}/`);
    }
  }

}

