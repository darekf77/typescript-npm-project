import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import * as inquirer from 'inquirer';
import * as rimraf from 'rimraf';
import * as json5 from 'json5';

import { config as configMorphi } from 'morphi/build/config';

import { config } from '../../../config';
import { Project } from './project';
import { Helpers } from '../../../helpers';
import { Models } from '../../../models';
import { Morphi } from 'morphi';


export abstract class SiteProject {


  get isSite(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isSite;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return false;
    }
    let basedOn = '';
    if (this.isWorkspace) {
      basedOn = this.packageJson.pathToBaseline;
    } else if (this.isWorkspaceChildProject) {
      basedOn = this.parent.packageJson.pathToBaseline;
    }

    // log('[tnp] basedOn' + basedOn)

    const res = (basedOn && basedOn !== '');
    // log(`[tnp] Project '${this.location}' is site: ${res}`)
    return !!res;
    //#endregion
  }


  /**
     * Check if project is based on baseline ( in package json workspace )
     * (method works from any level)
     */
  get isBasedOnOtherProject(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isBasedOnOtherProject;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return false;
    }
    if (this.isWorkspace) {
      return !!this.packageJson.pathToBaseline;
    } else if (this.isWorkspaceChildProject) {
      return this.parent && !!this.parent.packageJson.pathToBaseline;
    }
    //#endregion
  }


  /**
   * DONT USE WHEN IS NOT TO RESOLVE BASELINE PROJECT
   * USE isBasedOnOtherProject instead
   *
   * For site worksapce is baseline worksapace
   * For child site worksapce is baseline worksapce child
   */
  get baseline(this: Project): Project {
    if (Helpers.isBrowser) {
      return this.browser.baseline;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return;
    }
    if (this.isContainer) {
      if (global.tnp_normal_mode) {
        Helpers.error(`Baseline for container is not supported`, true, false)
      }
    } else if (this.isWorkspace) {
      return this.packageJson.pathToBaseline && Project.From(this.packageJson.pathToBaseline);
    } else if (this.isWorkspaceChildProject) {
      return this.parent && this.parent.baseline && Project.From(path.join(this.parent.baseline.location, this.name));
    }
    //#endregion
  }

}

// export interface SiteProject extends Partial<Project> { };
