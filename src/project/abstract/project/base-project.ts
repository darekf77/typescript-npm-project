//#region @backend
import chalk from 'chalk';
export { ChildProcess } from 'child_process';
//#endregion
import * as _ from 'lodash';

import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { Morphi } from 'morphi';

import { Project } from './project';
import { config } from '../../../config';

export abstract class BaseProject {

  browser: Models.other.IProject = {} as any;

  public get genericName(this: Project): string {

    if (Helpers.isBrowser) {
      return this.browser.genericName;
    }
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return;
    }
    let result = [
      (this.isWorkspace && this.isGenerated) ? `${(this.origin && this.origin.parent) ?
        this.origin.parent.name : ' - no origin - '}` : ''
    ];
    result = result.concat(this.findPrentsNames(this));
    if (this.isGenerated) {
      result.push(`((${chalk.bold('GENERATED')}))${this.name}`)
    } else {
      result.push(this.name);
    }
    return result.filter(f => !!f).join('/').trim()
    //#endregion
  }

  private findPrentsNames(this: Project, project: Project, result = []): string[] {
    if (!project) {
      return result.reverse();
    }
    if (project && project.parent) {
      result.push(project.parent.name)
    }
    return this.findPrentsNames(project.parent, result);
  }

  get isPreviewFor(this: Project): Project {
    let previewFor: Project;

    if (
      this.parent &&
      this.parent.isStandaloneProject &&
      (this.name === config.folder.preview)
    ) {
      previewFor = this.parent;
    } else if (
      this.parent &&
      this.parent.parent &&
      this.parent.parent.isStandaloneProject &&
      (this.parent.name === config.folder.preview)
    ) {
      previewFor = this.parent.parent;
    } else if (
      this.parent &&
      this.parent.parent &&
      this.parent.parent.parent &&
      this.parent.parent.parent.isStandaloneProject &&
      (this.parent.parent.name === config.folder.preview)
    ) {
      previewFor = this.parent.parent;
    }
    if (previewFor && previewFor.isTnp) {
      return;
    }
    return previewFor;
  }

  public get backupName(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.backupName;
    }
    //#region @backend
    if (this.typeIs('unknow')) {
      return;
    }
    return `tmp-${this.name}`
    //#endregion
  }



  get isContainerWorkspaceRelated(this: Project) {
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
    return this.typeIs('workspace');
    //#endregion
  }

  get isContainer(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isContainer;
    }
    //#region @backend
    return this.typeIs('container');
    //#endregion
  }

  get isContainerWithLinkedProjects(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isContainerWithLinkedProjects;
    }
    //#region @backend
    return this.isContainer && this.linkedProjects.length > 0;
    //#endregion
  }

  get isContainerChild(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isContainerChild;
    }
    //#region @backend
    return !!this.parent && this.parent.typeIs('container');
    //#endregion
  }


  //#region @backend
  get labels(this: Project) {
    const self = this;
    return {
      get generated() {
        return self.isGenerated ? '(generated)' : ''
      },
      get extendedBoldName() {
        return chalk.bold(`${self.labels.generated} ${self.parent ? (self.parent.name + '/') : ''}${self.name}`);
      }

    }
  }
  //#endregion

  get isWorkspaceChildProject(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isWorkspaceChildProject;
    }
    //#region @backend
    if (!!this.parent && this.parent.isWorkspaceChildProject) { // QUICK_FIX for temporary projects
      return true;
    }
    return !!this.parent && this.parent.typeIs('workspace');
    //#endregion
  }



  /**
   * Standalone project ready for publish on npm
   * Types of standalone project:
   * - isomorphic-lib : backend/fronded ts library with server,app preview
   * - angular-lib: frontend ui lib with angular preview
   */
  get isStandaloneProject(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isStandaloneProject;
    }
    //#region @backend
    if (this.typeIs('unknow')) {
      return false;
    }
    return (!this.isWorkspaceChildProject && !this.isWorkspace && !this.isContainer && !this.isUnknowNpmProject);
    //#endregion
  }


  //#region @backend
  get workspaceDependencies(this: Project): Project[] {
    if (this.typeIs('unknow')) {
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
          Helpers.error(`Unknow child "${name}" inside ${this.packageJson.path}`, false, true);
        }
        return child;
      }).filter(f => !!f);
    }
    return [];
  }
  //#endregion

  //#region @backend
  get workspaceDependenciesServers(this: Project): Project[] {
    if (this.typeIs('unknow')) {
      return [];
    }
    let servers: Project[] = [];
    if (this.isWorkspaceChildProject) {
      if (this.isSite) {
        servers = this.baseline.workspaceDependenciesServers.map(c => {
          return this.parent.child(c.name);
        });
      } else {
        servers = this.packageJson.workspaceDependenciesServers.map(name => {
          const child = this.parent.child(name);
          if (!child) {
            Helpers.error(`Unknow child "${name}" inside ${this.packageJson.path}`, false, true);
          }
          return child;
        }).filter(f => !!f);
      }
    }
    let foundedBadServer: Project;
    if (!_.isUndefined(servers.find(c => {
      const res = this.workspaceDependencies.indexOf(c) !== -1;
      if (res) {
        foundedBadServer = c;
      }
      return res;
    }))) {
      Helpers.error(`

Please put your server dependencies (in package.json) to :
workspaceDependencies: ["${foundedBadServer.name}"]
workspaceDependenciesServer: []
or
workspaceDependencies: []
workspaceDependenciesServer: ["${foundedBadServer.name}"]

NEVER like this:
workspaceDependencies: ["${foundedBadServer.name}"]
workspaceDependenciesServer: ["${foundedBadServer.name}"]

      `)
    }
    return servers;
  }
  //#endregion



  //#region @backend
  linkTo(this: Project, destPackageLocation: string) {
    Helpers.createSymLink(this.location, destPackageLocation);
  }
  //#endregion


}

// export interface BaseProject extends Partial<Project> { };
