//#region @backend
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import { LibProject } from "./abstract";
import { ProjectAngularClient } from "./project-angular-client";
import { BuildDir } from "../models";
import { error, tryRemoveDir, HelpersLinks } from "../helpers";
import config from "../config";
import { Project } from './abstract';
import { Helpers } from 'morphi/helpers';
import { BuildOptions } from './features/build-options';
import { IncrementalBuildProcessExtended } from './features/build-isomorphic-lib';
import { ProjectIsomorphicLib } from './project-isomorphic-lib';

export class ProjectAngularLib extends LibProject {

  private projectAngularClient: ProjectAngularClient;


  constructor(public location: string) {
    super(location);
    if (_.isString(location)) {
      this.projectAngularClient = new ProjectAngularClient(location);
      this.projectAngularClient.env = this.env; // TODO QUICK_FIX
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


  projectSpecyficFiles() {
    return super.projectSpecyficFiles().concat([
      'gulpfile.ts',
      'ng-package.json',
      'tsconfig-aot.bundle.json',
      'tsconfig-aot.dist.json',
      "tsconfig.isomorphic.json",
      "tsconfig.browser.json",
      'src/tsconfig.packages.json'
    ]).concat(this.projectAngularClient.projectSpecyficFiles());
  }


  private linkDistAsModule(outDir: BuildDir, continueWhenExistedFolderDoesntExists = false) {
    tryRemoveDir(path.join(this.location, config.folder.module));
    const inLocationOutDir = path.join(this.location, outDir);
    const inLocationModuleDir = path.join(this.location, config.folder.module)
    const inLocationBrowserDir = path.join(this.location, config.folder.browser)
    // console.log(`Create symlink from: ${inLocationOutDir} to ${inLocationModuleDir}`)
    HelpersLinks.createSymLink(inLocationOutDir, inLocationModuleDir, { continueWhenExistedFolderDoesntExists });
    HelpersLinks.createSymLink(inLocationOutDir, inLocationBrowserDir, { continueWhenExistedFolderDoesntExists });
  }

  async buildLib(outDir: BuildDir, forClient: Project[] = [], prod?: boolean, watch?: boolean) {

    // const outputLineReplace = (line) => {
    //   // console.log('LINE:',line)
    //   return line.replace('tmp/inlined-dist/src', 'components')
    // };

    // if (watch) {
    //   tryRemoveDir(path.join(this.location, outDir))
    //   if (outDir === 'dist') {
    //     this.linkDistAsModule(outDir, true)
    //   }
    //   this.run(`npm-run gulp inline-templates-${outDir}-watch`,
    //     { output: false, outputLineReplace }).async()
    //   setTimeout(() => {
    //     this.run(`npm-run tsc -w -p tsconfig-aot.${outDir}.json`, { output: true, outputLineReplace }).async()
    //   }, 3000)

    // } else {
    //   await Helpers.compilationWrapper(() => {
    //     tryRemoveDir(path.join(this.location, outDir))
    //     this.run(`npm-run gulp inline-templates-${outDir}`,
    //       { output: false, outputLineReplace }).sync()
    //     this.run(`npm-run tsc -p tsconfig-aot.${outDir}.json`, { output: true, outputLineReplace }).sync()
    //     if (outDir === 'dist') {
    //       this.linkDistAsModule(outDir)
    //     }
    //   }, `angular-lib (project ${this.name})`)
    // }
    if (!this.isStandaloneProject && forClient.length === 0) {

      while (this.buildOptions.forClient.length === 0) {

        await ProjectIsomorphicLib.selectClients(this.buildOptions, this)
      }

    }
    if (watch) {

      await (new IncrementalBuildProcessExtended(this, this.buildOptions)).startAndWatch('isomorphic angular-lib compilation (watch mode)')
    } else {
      await (new IncrementalBuildProcessExtended(this, this.buildOptions)).start('isomorphic angular-lib compilation')
    }

    return this;
  }


  async buildSteps(buildOptions?: BuildOptions) {
    const { prod, watch, outDir, appBuild, onlyWatchNoBuild, forClient, compileOnce } = buildOptions;



    if (!onlyWatchNoBuild) {
      if (appBuild) {
        await this.projectAngularClient.buildSteps(buildOptions);
      } else {
        if (watch) {
          await this.buildLib(outDir, forClient as Project[], prod, false);
          if (compileOnce) {
            return;
          }
          await this.buildLib(outDir, forClient as Project[], prod, true)
        } else {
          await this.buildLib(outDir, forClient as Project[], prod, false)
        }
      }
    }

  }


}

//#endregion
