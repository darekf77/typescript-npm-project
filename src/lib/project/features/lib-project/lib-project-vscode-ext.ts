import { config } from "tnp-config/src";
import { crossPlatformPath, fse, path, _, chalk } from "tnp-core/src";
import { BaseFeatureForProject, Helpers } from "tnp-helpers/src";
import { Project } from "../../abstract/project";
import { Models } from "../../../models";
import { ReleaseOptions } from "../../../build-options";

export class LibProjectVscodeExt extends BaseFeatureForProject<Project> {

  public get extensionVsixName() {
    return `${this.project.name}-${this.project.version}.vsix`;
  }



  // methods / install locally
  async installLocaly(releaseOptions?: ReleaseOptions) {
    //
    if (this.project.__isVscodeExtension) {
      const vsixPackageName = this.extensionVsixName;
      if (!this.project.containsFile(config.folder.out)) {
        Helpers.error(`Please build your project: ${config.frameworkName} build:dist`, false, true);
      }
      // if (!Helpers.exists(this.path(vsixPackageName).absolute.normal)) {
      await this.createVscePackage(false);
      // }
      Helpers.info(`Installing extension: ${vsixPackageName} `
        + `with creation date: ${fse.lstatSync(this.project.pathFor(vsixPackageName)).birthtime}...`);
      this.project.run(`code --install-extension ${vsixPackageName}`).sync();
    }

  }


  // methods / create vscode package
  async createVscePackage(showInfo = true) {
    //
    const vsixPackageName = this.extensionVsixName;
    try {
      await Helpers.actionWrapper(() => {
        this.project.run(`firedev-vsce package`).sync();
      }, `Building vsix package ` + chalk.bold(vsixPackageName) + `... `);
      if (showInfo) {
        const commandInstall = chalk.bold(`${config.frameworkName} install:locally`);
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
