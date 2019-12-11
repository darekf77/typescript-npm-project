//#region @backend
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import { ProjectAngularClient } from './project-angular-client';
import { Helpers } from '../../helpers';
import { config } from '../../config';
import { Project } from '../abstract';
import { BuildOptions } from '../features';
import { IncrementalBuildProcessExtended } from '../compilers/build-isomorphic-lib/incremental-build-process';
import { ProjectIsomorphicLib } from './project-isomorphic-lib';
import { selectClients } from './select-clients';

export class ProjectAngularLib extends Project {

  private projectAngularClient: ProjectAngularClient;


  constructor(public location: string) {
    super(location);
    if (_.isString(location)) {
      this.projectAngularClient = new ProjectAngularClient(location);
      this.projectAngularClient.env = this.env; // QUICK_FIX
    }
    if (this.frameworkVersion === 'v2' && this.isWorkspaceChildProject && this.parent.frameworkVersion !== 'v2') {
      Helpers.error(`Please use angular-lib-v2 only in workspace-v2`, false, true);
    }

    if (this.frameworkVersion === 'v2') {
      const styleCss = path.join(this.location, 'src/styles.css');
      const styleScss = path.join(this.location, 'src/styles.scss');
      if (!fse.existsSync(styleScss)) {
        if (fse.existsSync(styleCss)) {
          Helpers.copyFile(styleCss, styleScss);
        } else {
          Helpers.writeFile(styleScss, ` /* You can add global styles to this file, and also import other style files */`);
        }
      }
    }
  }

  public setDefaultPort(port: number) {
    this.projectAngularClient.setDefaultPort(port)
  }

  public getDefaultPort() {
    return this.projectAngularClient.getDefaultPort()
  }

  protected startOnCommand(args) {
    const command = this.projectAngularClient.startOnCommand(args);
    // console.log(`Command is running async: ${command}`)
    return command;
  }

  filesTemplates() {
    let config = [
      'tsconfig.isomorphic.json.filetemplate',
      'tsconfig.json.filetemplate',
      ...this.projectAngularClient
        .filesTemplates()
        .filter(f => !f.startsWith('webpack.config.'))
    ]
    if (this.frameworkVersion === 'v2') {

      config = config.concat([
        'angular.json.filetemplate',
        'browserslist.filetemplate',
        'ngsw-config.json.filetemplate',
        'tsconfig.app.json.filetemplate',
        'src/index.html.filetemplate',
        'src/manifest.webmanifest.filetemplate'
      ])
      config = config.filter(f => {
        return !['.angular-cli.json.filetemplate'].includes(f)
      });

      // console.log('config',config)
      // process.exit(0)
    }
    return config;
  }

  projectSpecyficFiles() {
    const config = super.projectSpecyficFiles()
      .filter(f => {
        return !['src/index.html'].includes(f)
      })
      .concat([
        'tsconfig.isomorphic.json',
        'tsconfig.browser.json',
        'karma.conf.js.filetemplate',
        ...this.filesTemplates(),
        'src/tsconfig.packages.json'
      ]).concat(this.projectAngularClient
        .projectSpecyficFiles()
        .filter(f => {
          return !['.angular-cli.json.filetemplate'].includes(f)
        })
        .filter(f => !f.startsWith('webpack.config.'))
        .filter(f => {
          return f !== 'src/tsconfig.app.json';
        }));


    if (this.frameworkVersion === 'v2') {
      return config.concat([

      ])
    }
    return config
  }


  sourceFilesToIgnore() {
    return this.projectSpecyficFiles();
  }

  async buildLib() {

    if (!this.isStandaloneProject && this.buildOptions.forClient.length === 0) {
      while (this.buildOptions.forClient.length === 0) {
        await selectClients(this.buildOptions, this, true);
      }
    }

    const { skipBuild = false } = require('minimist')(this.buildOptions.args.split(' '));
    if (skipBuild) {
      Helpers.log(`Skip build `);
      return;
    }

    if (this.buildOptions.watch) {
      await (new IncrementalBuildProcessExtended(this, this.buildOptions))
        .startAndWatch(`isomorphic ${this.type} compilation (watch mode)`);
    } else {
      await (new IncrementalBuildProcessExtended(this, this.buildOptions))
        .start(`isomorphic ${this.type} compilation`);
    }

  }

  async buildSteps(buildOptions?: BuildOptions) {
    const { appBuild, onlyWatchNoBuild } = buildOptions;

    if (!onlyWatchNoBuild) {
      if (appBuild) {
        await this.projectAngularClient.buildSteps(buildOptions);
      } else {
        await this.buildLib();
      }
    }

  }


}

//#endregion
