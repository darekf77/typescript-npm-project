//#region @backend
import { fse, json5 } from 'tnp-core'
import { path } from 'tnp-core'
import { IncrementalBuildProcess } from '../compilers/build-isomorphic-lib/compilations/incremental-build-process.backend';
import { Project } from '../abstract/project/project';
//#endregion
import { BuildOptions } from 'tnp-db';
import { CLASS } from 'typescript-class-helpers';
import { _ } from 'tnp-core';
import { ProjectAngularClient } from './project-angular-client';
import { Helpers } from 'tnp-helpers';

//#region @backend
@CLASS.NAME('ProjectAngularLib')
//#endregion
export class ProjectAngularLib
  //#region @backend
  extends Project
//#endregion
{
  private projectAngularClient: ProjectAngularClient;

  //#region @backend
  constructor(public location: string) {
    super(location);
    if (_.isString(location)) {
      this.projectAngularClient = new ProjectAngularClient(location);
      this.projectAngularClient.env = this.env; // QUICK_FIX
    }
  }
  //#endregion

  async initProcedure() {
    //#region @backendFunc
    if (
      this.frameworkVersionAtLeast('v2')
      && this.isWorkspaceChildProject
      && !this.parent.frameworkVersionAtLeast(this._frameworkVersion)
    ) {
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

    }
    //#endregion
  }

  public setDefaultPort(port: number) {
    //#region @backend
    this.projectAngularClient.setDefaultPort(port)
    //#endregion
  }

  public getDefaultPort() {
    //#region @backendFunc
    return this.projectAngularClient.getDefaultPort()
    //#endregion
  }

  protected startOnCommand(args) {
    //#region @backendFunc
    const command = this.projectAngularClient.startOnCommand(args);
    // console.log(`Command is running async: ${command}`)
    return command;
    //#endregion
  }

  filesTemplates() {
    //#region @backendFunc
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
    }

    return config;
    //#endregion
  }

  projectLinkedFiles() {
    //#region @backendFunc
    let files = super.projectLinkedFiles();

    if (this.frameworkVersionAtLeast('v3')) {
      return files;
    }

    if (this.frameworkVersionAtLeast('v2')) {
      files = files.concat([
        {
          sourceProject: Project.by<Project>('isomorphic-lib', this._frameworkVersion),
          relativePath: 'tsconfig.browser.json.filetemplate',
        },
        {
          sourceProject: Project.by<Project>('isomorphic-lib', this._frameworkVersion),
          relativePath: 'tsconfig.isomorphic.json.filetemplate'
        }
      ])
    }
    return files;
    //#endregion
  }

  projectSpecyficFiles() {
    //#region @backendFunc
    let config = super.projectSpecyficFiles()
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
      config = config.concat([
        'src/index.html'
      ]).filter(f => {
        return ![
          'src/tsconfig.packages.json',
          'src/tsconfig.spec.json',
          'src/tsconfig.app.json.filetemplate',
          'src/tsconfig.app.json',
        ].includes(f);
      })
    }
    return config;
    //#endregion
  }

  sourceFilesToIgnore() {
    //#region @backendFunc
    return this.projectSpecyficFiles();
    //#endregion
  }

  async buildLib() {
    //#region @backendFunc
    const { outDir, ngbuildonly, watch } = this.buildOptions;
    this.beforeLibBuild(outDir);
    if (ngbuildonly) {
      // await this.buildAngulazrVer(watch);
    } else {
      const incrementalBuildProcess = new IncrementalBuildProcess(this, this.buildOptions);

      if (this.buildOptions.watch) {
        await incrementalBuildProcess.startAndWatch(`isomorphic ${this._type} compilation (watch mode)`,
          {
            watchOnly: this.buildOptions.watchOnly,
            afterInitCallBack: async () => {
              await this.compilerCache.setUpdatoDate.incrementalBuildProcess();
            }
          });
      } else {
        await incrementalBuildProcess.start(`isomorphic ${this._type} compilation`);
        // if (outDir === 'bundle') {

        //   this.buildAngularVer();
        // }
      }
    }
    //#endregion
  }

  async buildSteps(buildOptions?: BuildOptions) {
    //#region @backendFunc
    const { appBuild, onlyWatchNoBuild } = buildOptions;

    if (!onlyWatchNoBuild) {
      if (appBuild) {
        await this.projectAngularClient.buildSteps(buildOptions);
      } else {
        await this.buildLib();
      }
    }
    //#endregion
  }

}
