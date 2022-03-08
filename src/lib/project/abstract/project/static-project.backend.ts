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
import { StaticBuild } from '../../features';


export abstract class StaticProject {

  //#region @backend
  public staticBuild: StaticBuild;
  //#endregion


  /**
   * Project can be generated becouse it is a part of:
   * 1. Static build -> bulding 'bundle; in workspace from all childrens
   * 2. Standalone Container singular build -> watcg build in 'dist' of all standalone libs from container as one
   * 3. [WIP] Workspace watch build of all childrens in 'dist'
   */
  // @ts-ignore
  get isGenerated(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isGenerated;
    }
    //#region @backend
    if (this.typeIs('unknow')) {
      return false;
    }
    if (this.isStandaloneProject && this.packageJson.isGenerated) {
      return true;
    }
    return (this.isWorkspaceChildProject && this.parent.packageJson.isGenerated) ||
      (this.isWorkspace && this.packageJson.isGenerated)
    //#endregion
  }

  // @ts-ignore
  get isGeneratedForRelease(this: Project) {
    return this.packageJson.isGeneratedForRelease;
  }

  /**
   * Only for generated projects
   */
  // @ts-ignore
  get origin(this: Project): Project {
    if (this.typeIs('unknow')) {
      return;
    }
    if (!this.isGenerated) {
      // console.log('global.globalSystemToolMode',global.globalSystemToolMode)
      if (global.globalSystemToolMode) {
        Helpers.warn(`Trying to access origin of not static project for ${this.location}`);
      }
      return;
    }
    let project: Project;
    if (this.isWorkspace
      // || this.isStandaloneProject TODO this will gaterh all bundles worker ??
    ) {
      const originPath = path.resolve(path.join(this.location, '..', '..'));
      // console.log('originPath', originPath)
      project = Project.From<Project>(originPath);
    } else if (this.isWorkspaceChildProject) {
      const originChildPath = path.resolve(path.join(this.location, '..', '..', '..', this.name));
      // console.log('originChildPath', originChildPath)
      project = Project.From<Project>(originChildPath);
    }
    return project;
  }

  /**
   * generated version of workspace/worskpace-childs project
   * ready for serving by  framework router/proxy
   */
  // @ts-ignore
  get bundledWorkspace(this: Project): Project {
    if (this.typeIs('unknow')) {
      return;
    }
    const outDir: Models.dev.BuildDir = 'bundle';
    let projectToBuild: Project;
    if (this.isGenerated) {
      if (!global.globalSystemToolMode) {
        return;
      }
      Helpers.warn(`Trying to access bundle of bundle for project of location:
        ${this.location}
      `);
      return;
    }
    if (this.isWorkspace) {
      projectToBuild = Project.From<Project>(path.join(this.location, outDir, this.name));
    } else if (this.isWorkspaceChildProject) {
      projectToBuild = Project.From<Project>(path.join(this.parent.location, outDir, this.parent.name, this.name));
    } else if (this.isStandaloneProject) {
      projectToBuild = Project.From<Project>(path.join(this.location, outDir));
    }
    return projectToBuild;
  }

  /**
   * Same thing as bundle workspace, but it will generate folder in
   * case that the does not exists
   */
  async StaticVersion(this: Project, regenerate = true): Promise<Project> {
    if (this.typeIs('unknow')) {
      return;
    }
    let staticVersion: Project;
    if (this.isGenerated) {
      if (regenerate) {
        if (this.origin) {
          await this.origin.staticBuild.regenerate();
        } else {
          return void 0;
        }

      }
      staticVersion = this as any;
    } else {

      if (regenerate || !this.bundledWorkspace) {
        await this.staticBuild.regenerate();
      }
      staticVersion = this.bundledWorkspace;
    }

    return staticVersion;
  }

}

// export interface StaticProject extends Partial<Project> { }
