//#region imports
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import chalk from 'chalk';
import * as TerminalProgressBar from 'progress';

import { config } from 'tnp-config';
import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { FeatureForProject } from '../../abstract';
import {
  dedupePackages, nodeModulesExists, addDependenceis, stuberizeFrontendPackages
} from './node-modules-helpers.backend';
//#endregion

export class NodeModulesCore extends FeatureForProject {

  public get path() { return path.join(this.project.location, config.folder.node_modules); }
  public get exist() { return nodeModulesExists(this.project); }
  public dedupe = (packages?: string[]) => dedupePackages(this.project.location, packages);
  public stuberizeFrontendPackages = (packages?: string[]) => stuberizeFrontendPackages(this.project, packages);
  public dedupeCount = (packages?: string[]) => dedupePackages(this.project.location, packages, true);
  public remove = () => Helpers.tryRemoveDir(this.path);
  public linkToProject = (target: Project) => Helpers.createSymLink(this.path, target.node_modules.path);

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
