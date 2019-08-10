//#region @backend
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import { LibProject } from './abstract';
import { ProjectAngularClient } from './project-angular-client';
import { BuildDir } from '../models';
import { error, tryRemoveDir, HelpersLinks, log } from '../helpers';
import config from '../config';
import { Project } from './abstract';
import { Helpers } from 'morphi/helpers';
import { BuildOptions } from './features/build-options';
import { IncrementalBuildProcessExtended } from './features/build-isomorphic-lib';
import { ProjectIsomorphicLib } from './project-isomorphic-lib';
import { selectClients } from './select-clients';

export class ProjectAngularLib extends LibProject {

  private projectAngularClient: ProjectAngularClient;


  constructor(public location: string) {
    super(location);
    if (_.isString(location)) {
      this.projectAngularClient = new ProjectAngularClient(location);
      this.projectAngularClient.env = this.env; // QUICK_FIX
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
    return [
      'tsconfig.isomorphic.json.filetemplate',
      'tsconfig.json.filetemplate',
      ...this.projectAngularClient
        .filesTemplates()
        .filter(f => !f.startsWith('webpack.config.'))
    ]
  }

  projectSpecyficFiles() {
    return super.projectSpecyficFiles().concat([
      'tsconfig.isomorphic.json',
      'tsconfig.browser.json',
      'karma.conf.js.filetemplate',
      ...this.filesTemplates(),
      'src/tsconfig.packages.json'
    ]).concat(this.projectAngularClient
      .projectSpecyficFiles()
      .filter(f => !f.startsWith('webpack.config.'))
      .filter(f => {
        return f !== 'src/tsconfig.app.json';
      }));
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
      log(`Skip build `);
      return;
    }

    if (this.buildOptions.watch) {
      await (new IncrementalBuildProcessExtended(this, this.buildOptions))
        .startAndWatch('isomorphic angular-lib compilation (watch mode)');
    } else {
      await (new IncrementalBuildProcessExtended(this, this.buildOptions))
        .start('isomorphic angular-lib compilation');
    }

    return this;
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
