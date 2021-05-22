import chalk from 'chalk';
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import { _ } from 'tnp-core';
import * as inquirer from 'inquirer';
import * as json5 from 'json5';

import { config as configMorphi } from 'morphi';

import { config } from 'tnp-config';
import { Project } from './project';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { Morphi } from 'morphi';


export abstract class SiteProject {

  get isSite(this: Project) {
    if (_.isUndefined(this.cache['isSite'])) {
      const result = this.isSiteInStrictMode || this.isSiteInDependencyMode;
      this.cache['isSite'] = result;
      return result;
    } else {
      return this.cache['isSite'];
    }
  }

  get isSiteInStrictMode(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isSiteInStrictMode;
    }
    //#region @backend
    if (this.typeIs('unknow')) {
      return false;
    }
    if (this.isSiteInDependencyMode) {
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

  get isSiteInDependencyMode(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isSiteInDependencyMode;
    }
    //#region @backend
    if (this.typeIs('unknow') || this.isStandaloneProject) {
      return false;
    }
    if (this.isWorkspace || this.isWorkspaceChildProject) {
      const workspace = (this.isWorkspace ? this : this.parent)
      return workspace.packageJson.dependsOn.length > 0;
    }
    return false;

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
    if (this.typeIs('unknow')) {
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
      return this.browser.baseline as any;
    }
    //#region @backend
    if (this.typeIs('unknow')) {
      return;
    }
    if (this.isContainer) {
      if (global.globalSystemToolMode) {
        Helpers.warn(`Baseline for container is not supported`)
      }
      return;
    } else if (this.isWorkspace) {
      return this.packageJson.pathToBaseline && Project.From<Project>(this.packageJson.pathToBaseline);
    } else if (this.isWorkspaceChildProject) {
      return this.parent && this.parent.baseline && Project.From<Project>(path.join(this.parent.baseline.location, this.name));
    }
    //#endregion
  }

}

// export interface SiteProject extends Partial<Project> { };
