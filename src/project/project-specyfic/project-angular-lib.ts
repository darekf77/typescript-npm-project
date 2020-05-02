//#region @backend
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import { ProjectAngularClient } from './project-angular-client';
import { Helpers } from 'tnp-helpers';
import { config } from '../../config';
import { Project } from '../abstract';
import { BuildOptions } from '../features';
import { IncrementalBuildProcessExtended } from '../compilers/build-isomorphic-lib/incremental-build-process.backend';

export class ProjectAngularLib extends Project {

  private projectAngularClient: ProjectAngularClient;


  constructor(public location: string) {
    super(location);
    if (_.isString(location)) {
      this.projectAngularClient = new ProjectAngularClient(location);
      this.projectAngularClient.env = this.env; // QUICK_FIX
    }
  }

  async initProcedure() {

    if (this.frameworkVersionAtLeast('v2') && this.isWorkspaceChildProject && !this.parent.frameworkVersionAtLeast(this._frameworkVersion)) {
      Helpers.error(`Please use angular-lib-${this._frameworkVersion} only in workspace-${this._frameworkVersion}`, false, true);
    }

    if (this.frameworkVersionAtLeast('v2')) {
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

    if (this.isCoreProject && this.frameworkVersionAtLeast('v2')) {
      this.applyLinkedFiles();
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
    if (this.frameworkVersionAtLeast('v2')) {

      config = config
        .concat([
          ...this.vscodeFileTemplates,
          'angular.json.filetemplate',
          'browserslist.filetemplate',
          'ngsw-config.json.filetemplate',
          'tsconfig.app.json.filetemplate',
          'tsconfig.base.json.filetemplate',
          'src/index.html.filetemplate',
          'src/manifest.webmanifest.filetemplate'
        ]);
      config = config.filter(f => {
        return !['.angular-cli.json.filetemplate'].includes(f)
      });

      config = config.concat(this.projectLinkedFiles()
        .filter(({ relativePath }) => relativePath.endsWith('.filetemplate'))
        .map(({ relativePath }) => {
          return relativePath;
        }));
      // console.log('config',config)
      // process.exit(0)
    }



    return config;
  }

  projectLinkedFiles() {
    let files = super.projectLinkedFiles();

    if (this.frameworkVersionAtLeast('v2')) {
      files = files.concat([
        {
          sourceProject: Project.by('isomorphic-lib', this._frameworkVersion),
          relativePath: 'tsconfig.browser.json.filetemplate',
        },
        {
          sourceProject: Project.by('isomorphic-lib', this._frameworkVersion),
          relativePath: 'tsconfig.isomorphic.json.filetemplate'
        }
      ])
    }
    return files;
  }

  projectSpecyficFiles() {
    const config = super.projectSpecyficFiles()
      .concat([
        'tsconfig.browser.json',
        'karma.conf.js.filetemplate',
        ...this.filesTemplates(),
        'src/tsconfig.packages.json'
      ]).concat(this.projectAngularClient
        .projectSpecyficFiles()
        .filter(f => {
          return ![
            '.angular-cli.json.filetemplate',
            'tsconfig.json',
          ].includes(f)
        })
        .filter(f => !f.startsWith('webpack.config.'))
        .filter(f => {
          return f !== 'src/tsconfig.app.json';
        }));


    if (this.frameworkVersionAtLeast('v2')) {
      return config.concat([

      ]).filter(f => {
        return ![
          'src/tsconfig.packages.json',
          'src/tsconfig.spec.json',
          'src/tsconfig.app.json.filetemplate',
          'src/tsconfig.app.json',
        ].includes(f);
      })
    }
    return config
  }


  sourceFilesToIgnore() {
    return this.projectSpecyficFiles();
  }

  async buildLib() {

    const { skipBuild = false } = require('minimist')(this.buildOptions.args.split(' '));
    if (skipBuild) {
      Helpers.log(`Skip build `);
      return;
    }

    if (this.buildOptions.watch) {
      await (new IncrementalBuildProcessExtended(this, this.buildOptions))
        .startAndWatch(`isomorphic ${this._type} compilation (watch mode)`);
    } else {
      await (new IncrementalBuildProcessExtended(this, this.buildOptions))
        .start(`isomorphic ${this._type} compilation`);
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
