import { CLI } from "tnp-cli";
import { config } from "tnp-config";
import { crossPlatformPath, fse, path, _ } from "tnp-core";
import { Helpers } from "tnp-helpers";
import { Models } from "tnp-models";
import type { LibProject } from "./lib-project.backend";
import { Project } from "./project";


export class LibProjectVscodeExt {

  // @ts-ignore
  public get extensionVsixName() {
    return `${this.lib.name}-${this.lib.version}.vsix`;
  }

  constructor(
    private lib: Project
  ) {

  }


  // methods / install locally
  async installLocaly(releaseOptions?: Models.dev.ReleaseOptions) {
    //
    if (this.lib.isVscodeExtension) {
      const vsixPackageName = this.extensionVsixName;
      if (!this.lib.containsFile(config.folder.out)) {
        Helpers.error(`Please build your project: ${config.frameworkName} build:dist`, false, true);
      }
      // if (!Helpers.exists(this.path(vsixPackageName).absolute.normal)) {
      await this.createVscePackage(false);
      // }
      Helpers.info(`Installing extension: ${vsixPackageName} `
        + `with creation date: ${fse.lstatSync(this.lib.path(vsixPackageName).absolute.normal).birthtime}...`);
      this.lib.run(`code --install-extension ${vsixPackageName}`).sync();
    }

  }


  // methods / create vscode package
  async createVscePackage(showInfo = true) {
    //
    const vsixPackageName = this.extensionVsixName;
    try {
      await Helpers.actionWrapper(() => {
        this.lib.run(`vsce package`).sync();
      }, `Building vsix package ` + CLI.chalk.bold(vsixPackageName) + `... `);
      if (showInfo) {
        const commandInstall = CLI.chalk.bold(`${config.frameworkName} install:locally`);
        Helpers.info(`

        Please use command: ${commandInstall} # or ${config.frameworkName} il
        to install this package in local vscode instance.

        `)
      }
    } catch (error) {
      Helpers.error(error, true, true);
      Helpers.error(`Not able to build ${vsixPackageName} package `);
    }

  }


}

