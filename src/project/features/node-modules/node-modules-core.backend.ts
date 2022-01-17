//#region imports
import { path } from 'tnp-core';
import { fse } from 'tnp-core';
import { _ } from 'tnp-core';
import { config } from 'tnp-config';
import { Project } from '../../abstract';
import { Helpers } from 'tnp-helpers';
import { FeatureForProject } from '../../abstract';
import {
  dedupePackages, nodeModulesExists, addDependenceis, stuberizeFrontendPackages
} from './node-modules-helpers.backend';
//#endregion

export class NodeModulesCore extends FeatureForProject {

  public get path() { return path.join(this.project.location, config.folder.node_modules); }
  public pathFor(packageName: string) {
    return path.join(this.path, packageName);
  }
  public get exist() { return nodeModulesExists(this.project); }
  public get isLink() { return Helpers.isLink(this.path); }
  public dedupe = (packages?: string[]) => {

    const packagesNames = (_.isArray(packages) && packages.length > 0) ? packages :
      (Project.Tnp as Project).packageJson.data.tnp.core.dependencies.dedupe;

    if (this.project.frameworkVersionEquals('v3')) { // TODO QUICK_FIX
      const onlyDedpupeForV3 = [
        "@angular/animations",
        "@angular/cdk",
        "@angular/common",
        "@angular/compiler",
        "@angular/http",
        "@angular/core",
        "@angular/forms",
        "@angular/material",
        "@angular/platform-browser",
        "@angular/platform-browser-dynamic",
        "@angular/pwa",
        "@angular/router",
        "@angular/service-worker",
        "zone.js",
        "typescript",
      ]

      const isomorphicPkgs = [
        ...this.project.isomorphicPackages,
        ...onlyDedpupeForV3,
      ];
      // console.log(`isomorphicPkgs ${this.project.name} ${this.project.location} `, isomorphicPkgs)
      dedupePackages(
        this.project.location,
        packagesNames.filter(f => isomorphicPkgs.includes(f)),
        false,
        !this.project.npmPackages.useSmartInstall
      );
    } else {
      dedupePackages(
        this.project.location,
        packagesNames,
        false,
        !this.project.npmPackages.useSmartInstall
      );
    }
  };
  // public stuberizeFrontendPackages = (packages?: string[]) => stuberizeFrontendPackages(this.project, packages);
  public dedupeCount = (packages?: string[]) => {
    dedupePackages(this.project.location, packages, true, !this.project.npmPackages.useSmartInstall)
  };
  public remove = (packageInside?: string) => {
    Helpers.info(`Removing node_modules from ${this.project?.name}`)
    if (packageInside) {
      Helpers.removeIfExists(path.join(this.path, packageInside))
      return;
    }
    Helpers.tryRemoveDir(this.path)
  };
  public linkToProject = (target: Project) => {
    if (!this.project.node_modules.exist && !this.project.isWorkspace) { // TODO QUICK_FIX make it async install
      this.project.run(`${config.frameworkName} install`).sync();
    }
    Helpers.createSymLink(this.path, target.node_modules.path)
  };

  /**
   * Just create folder... without npm instalation
   */
  public recreateFolder = () => !fse.existsSync(this.path) && Helpers.mkdirp(this.path);

  // public contains(pkg: Package) {
  //   if (_.isObject(pkg) && pkg.name) {
  //     if (fse.existsSync(path.join(this.path, pkg.name))) {

  //     }
  //   }
  //   return false;
  // }


}
