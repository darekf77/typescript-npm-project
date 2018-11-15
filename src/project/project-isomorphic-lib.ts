//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { Project } from "./base-project";
import { BuildOptions } from "../models";
import { ClassHelper, getWebpackEnv } from "../helpers";
// third part

import { BaseProjectLib } from "./base-project-lib";
import { HelpersLinks } from '../helpers-links';
import { config } from '../config';
import { IncrementalBuildProcessExtended } from '../build-isomorphic-lib/incremental-build-process';



export class ProjectIsomorphicLib extends BaseProjectLib {

  startOnCommand(args: string) {
    const command = `node run.js ${args}`;
    return command;
  }

  projectSpecyficFiles(): string[] {
    return super.projectSpecyficFiles().concat([
      '.vscode/launch.json',
      'run.js',
      "src/typings.d.ts",
      "tsconfig.json",
      "tsconfig.browser.json"
    ]);
  }

  projectSpecyficIgnoredFiles() {
    return [
      "src/entities.ts",
      "src/controllers.ts"
    ]
  }


  private get additionalRequiredIsomorphcLibs() {
    const result: string[] = []

    if (Array.isArray(this.requiredLibs)) { // TODO QUCIK_FIX not fixing this
      this.requiredLibs.forEach(d => {
        result.push(d.name);
      })
    }


    // console.log(result)
    // process.exit(0)
    return result;
  }

  private getIsomorphcLibNames(parentWorksapce = false) {
    let result = [];
    result = result.concat(this.additionalRequiredIsomorphcLibs);

    // console.log('result', result)
    // process.exit(0)
    return result;
  }

  buildSteps(buildOptions?: BuildOptions) {
    const { prod, watch, outDir, onlyWatchNoBuild } = buildOptions;
    if (!onlyWatchNoBuild) {
      this.buildLib(outDir, prod, watch);
    }
    return;
  }

  private copyWhenExist(source: string, outDir: string, folder = false) {
    const basename = source;
    source = path.join(this.location, source);
    outDir = path.join(this.location, outDir, basename);
    if (fse.existsSync(source)) {
      if (folder) {
        fse.copySync(source, outDir, { overwrite: true, recursive: true })
      } else {
        fse.copyFileSync(source, outDir);
      }
    }
  }
  private linkWhenExist(source: string, outLInk: string) {
    const basename = source;
    source = path.join(this.location, source);
    outLInk = path.join(this.location, outLInk, basename);
    if (fse.existsSync(outLInk)) {
      fse.unlinkSync(outLInk);
    }
    if (fse.existsSync(source)) {
      HelpersLinks.createLink(outLInk, source)
    }
  }

  buildLib(outDir: "dist" | "bundle", prod = false, watch = false) {
    const isomorphicNames = this.getIsomorphcLibNames(this.isWorkspaceChildProject)

    if (!this.isTnp) {
      this.copyWhenExist('bin', outDir, true) // TODO make this for each library
    }
    this.copyWhenExist('package.json', outDir, true)
    this.copyWhenExist('.npmrc', outDir, true)
    this.copyWhenExist('.npmignore', outDir, true)
    this.copyWhenExist('.gitignore', outDir, true)
    if (outDir === 'bundle') {
      this.linkWhenExist(config.folder.node_modules, outDir);
      if (this.isTnp) {
        this.linkWhenExist('projects', outDir);
        this.linkWhenExist('tests', outDir);
        this.linkWhenExist('autobuild.json', outDir);
      }
    }

    // console.log('config.file.tnpEnvironment_json',config.file.tnpEnvironment_json)

    if(watch) {
      new IncrementalBuildProcessExtended(this, this.buildOptions).startAndWatch('isomorphic compilation (watch mode)')
    } else {
      new IncrementalBuildProcessExtended(this, this.buildOptions).start('isomorphic compilation')
    }
    this.copytToManager.initCopyingOnBuildFinish(this.buildOptions);
  }

}
//#endregion
