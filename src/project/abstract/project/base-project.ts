//#region @backend
import chalk from 'chalk';
export { ChildProcess } from 'child_process';
//#endregion
import * as _ from 'lodash';

import { Models } from '../../../models';
import { Helpers } from '../../../helpers';
import { Morphi } from 'morphi';

import { Project } from './project';

export abstract class BaseProject {

  browser: Models.other.IProject = {} as any;

  public get genericName(this: Project): string {

    if (Helpers.isBrowser) {
      return this.browser.genericName;
    }
    //#region @backendFunc
    if (this.type === 'unknow') {
      return;
    }
    return [
      (this.isGenerated ? `((${chalk.bold('GENERATED')}))` : ''),
      ((this.isWorkspaceChildProject && this.parent.isContainerChild) ? this.parent.parent.name : ''),
      (this.isWorkspaceChildProject ? this.parent.name : ''),
      (this.isContainerChild ? this.parent.name : ''),
      ((this.isStandaloneProject && this.parent && this.parent.name) ? `<<${this.parent.genericName}>>` : ''),
      this.name
    ].filter(f => !!f).join('/').trim()
    //#endregion
  }

  public get backupName(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.backupName;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return;
    }
    return `tmp-${this.name}`
    //#endregion
  }



  get isForRecreation(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isForRecreation;
    }
    //#region @backend
    return (this.isWorkspaceChildProject || this.isWorkspace || this.isContainer);
    //#endregion
  }

  get isWorkspace(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isWorkspace;
    }
    //#region @backend
    return this.type === 'workspace';
    //#endregion
  }

  get isContainer(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isContainer;
    }
    //#region @backend
    return this.type === 'container';
    //#endregion
  }

  get isContainerChild(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isContainerChild;
    }
    //#region @backend
    return !!this.parent && this.parent.type === 'container';
    //#endregion
  }


  get labels(this: Project) {
    const self = this;
    return {
      get generated() {
        return self.isGenerated ? '(generated)' : ''
      },
      //#region @backend
      get extendedBoldName() {
        return chalk.bold(`${self.labels.generated} ${self.parent ? (self.parent.name + '/') : ''}${self.name}`);
      }
      //#endregion
    }
  }


  get isWorkspaceChildProject(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isWorkspaceChildProject;
    }
    //#region @backend
    if (!!this.parent && this.parent.isWorkspaceChildProject) { // QUICK_FIX for temporary projects
      return true;
    }
    return !!this.parent && this.parent.type === 'workspace';
    //#endregion
  }



  /**
   * Standalone projects link: npm libs
   */
  get isStandaloneProject(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isStandaloneProject;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return false;
    }
    return (!this.isWorkspaceChildProject && !this.isWorkspace && !this.isContainer && !this.isUnknowNpmProject);
    //#endregion
  }


  //#region @backend
  get workspaceDependencies(this: Project): Project[] {
    if (this.type === 'unknow') {
      return [];
    }
    if (this.isWorkspaceChildProject) {
      if (this.isSite) {
        return this.baseline.workspaceDependencies.map(c => {
          return this.parent.child(c.name);
        });
      }
      return this.packageJson.workspaceDependencies.map(name => {
        const child = this.parent.child(name);
        if (!child) {
          Helpers.error(`Unknow child "${name}" inside ${this.packageJson.path}`, true, true);
        }
        return child;
      }).filter(f => !!f);
    }
    return [];
  }
  //#endregion



  //#region @backend
  linkTo(this: Project, destPackageLocation: string) {
    Helpers.createSymLink(this.location, destPackageLocation);
  }
  //#endregion


}

// export interface BaseProject extends Partial<Project> { };
