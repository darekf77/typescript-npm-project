import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import * as inquirer from 'inquirer';
import * as json5 from 'json5';

import { config as configMorphi } from 'morphi';

import { config } from '../../../config';
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
   * Is generated for static build
   */
  get isGenerated(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isGenerated;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return false;
    }
    return (this.isWorkspaceChildProject && this.parent.packageJson.isGenerated) ||
      (this.isWorkspace && this.packageJson.isGenerated)
    //#endregion
  }


  /**
   * Only for generated projects
   */
  get origin(this: Project): Project {
    if (this.type === 'unknow') {
      return;
    }
    if (!this.isGenerated) {
      // console.log('global.tnp_normal_mode',global.tnp_normal_mode)
      if (global.tnp_normal_mode) {
        Helpers.warn(`Trying to access origin of not static project`, true);
      }
      return;
    }
    let project: Project;
    if (this.isWorkspace) {
      const originPath = path.resolve(path.join(this.location, '..', '..'));
      // console.log('originPath', originPath)
      project = Project.From(originPath);
    } else if (this.isWorkspaceChildProject) {
      const originChildPath = path.resolve(path.join(this.location, '..', '..', '..', this.name));
      // console.log('originChildPath', originChildPath)
      project = Project.From(originChildPath);
    }
    return project;
  }

  /**
   * generated version of workspace/worskpace-childs project
   * ready for serving by  framework router/proxy
   */
  get bundledWorkspace(this: Project): Project {
    if (this.type === 'unknow') {
      return;
    }
    const outDir: Models.dev.BuildDir = 'bundle';
    let projectToBuild: Project;
    if (this.isGenerated) {
      if (!global.tnp_normal_mode) {
        return;
      }
      Helpers.warn(`Trying to access bundle of bundle`, true);
      return;
    }
    if (this.isWorkspace) {
      projectToBuild = Project.From(path.join(this.location, outDir, this.name));
    } else if (this.isWorkspaceChildProject) {
      projectToBuild = Project.From(path.join(this.parent.location, outDir, this.parent.name, this.name));
    } else if (this.isStandaloneProject) {
      projectToBuild = Project.From(path.join(this.location, outDir));
    }
    return projectToBuild;
  }

  /**
   * Same thing as bundle workspace, but it will generate folder in
   * case that the does not exists
   */
  async StaticVersion(this: Project, regenerate = true): Promise<Project> {
    if (this.type === 'unknow') {
      return;
    }
    let staticVersion: Project;
    if (this.isGenerated) {
      if (regenerate) {
        await this.origin.staticBuild.regenerate();
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
