//#region @backend
import chalk from 'chalk';
export { ChildProcess } from 'child_process';
import { path } from 'tnp-core';
//#endregion
import { _ } from 'tnp-core';
import { Helpers } from 'tnp-helpers';
import type { Project } from './project';
import { config } from 'tnp-config';

export abstract class BaseProject {

  // @ts-ignore
  public get extensionVsixName(this: Project) {
    return `${this.name}-${this.version}.vsix`;
  }

  // @ts-ignore
  public get genericName(this: Project): string {

    if (Helpers.isBrowser) {
      return this.browser.genericName;
    }
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return;
    }
    if (!_.isNil(this.cache['genericName'])) {
      this.cache['genericName'];
    }
    let result = [
      (this.isWorkspace && this.isGenerated) ? `${(this.origin && this.origin.parent) ?
        this.origin.parent.name : ' - no origin - '}` : ''
    ];
    result = result.concat(this.findParentsNames(this));
    if (this.isGenerated) {
      result.push(`((${chalk.bold('GENERATED')}))${this.name}`)
    } else {
      result.push(this.name);
    }
    const res = result.filter(f => !!f).join('/').trim()
    if (_.isNil(this.cache['genericName'])) {
      this.cache['genericName'] = res;
    }
    return this.cache['genericName'];
    //#endregion
  }

  private findParentsNames(this: Project, project: Project, result = []): string[] {
    //#region @backendFunc
    if (!project) {
      return result.reverse();
    }
    if (project && project.parent) {
      result.push(project.parent.name)
    }
    return this.findParentsNames(project.parent, result);
    //#endregion
  }

  // @ts-ignore
  get isPreviewFor(this: Project): Project {
    //#region @backendFunc
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
    //#endregion
  }

  // @ts-ignore
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

  // @ts-ignore
  get isContainerWorkspaceRelated(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isForRecreation;
    }
    //#region @backend
    return (this.isWorkspaceChildProject || this.isWorkspace || this.isContainer);
    //#endregion
  }

  // @ts-ignore
  get isSmartContainer(this: Project) {
    return this.frameworkVersionAtLeast('v3')
      && this.packageJson.isSmart
      && this.isContainer
      && !this.isContainerCoreProject
      && !this.isContainerCoreProjectTempProj;
  }

  // @ts-ignore
  get isSmartContainerChild(this: Project) {
    return this.parent?.isSmartContainer;
  }

  // @ts-ignore
  get isContainerOrWorkspaceWithLinkedProjects(this: Project) {
    // @ts-ignore
    return (this.isContainer || this.isWorkspace) && this.packageJson.linkedProjects.length > 0;
  }

  // @ts-ignore
  get isVscodeExtension(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isForRecreation;
    }
    //#region @backend
    return this.typeIs('vscode-ext');
    //#endregion
  }

  // @ts-ignore
  get isWorkspace(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isWorkspace;
    }
    //#region @backend
    return this.typeIs('workspace');
    //#endregion
  }

  // @ts-ignore
  get isDocker(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isDocker;
    }
    //#region @backend
    return this.typeIs('docker');
    //#endregion
  }

  // @ts-ignore
  get isContainer(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isContainer;
    }
    //#region @backend
    return this.typeIs('container');
    //#endregion
  }

  // @ts-ignore
  get isContainerCoreProject(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isContainerCoreProject;
    }
    //#region @backend
    return this.isContainer && this.isCoreProject;
    //#endregion
  }

  // @ts-ignore
  get isContainerCoreProjectTempProj(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isContainerCoreProjectTempProj;
    }
    //#region @backend
    const dirpar = path.dirname(path.dirname(this.location));
    const isTemp = path.basename(dirpar) === 'tmp-smart-node_modules'; // TODO QUICK_FIX
    return this.isContainerCoreProject && isTemp;
    //#endregion
  }

  // @ts-ignore
  get isContainerChild(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isContainerChild;
    }
    //#region @backend
    return !!this.parent && this.parent.typeIs('container');
    //#endregion
  }

  // @ts-ignore
  get labels(this: Project) {
    const self = this;
    return {
      get generated() {
        //#region @backendFunc
        return self.isGenerated ? '(generated)' : '';
        //#endregion
      },
      get extendedBoldName() {
        //#region @backendFunc
        return chalk.bold(`${self.labels.generated} ${self.parent ? (self.parent.name + '/') : ''}${self.name}`);
        //#endregion
      }
    }
  }

  //#region @backend
  // @ts-ignore
  get allResources(this: Project) {
    const resurces = [
      config.file.package_json,
      'tsconfig.json',
      'tsconfig.browser.json',
      'tsconfig.isomorphic.json',
      config.file._npmrc,
      config.file._npmignore,
      config.file._gitignore,
      config.file.environment_js,
      config.file.tnpEnvironment_json,
      config.folder.bin,
      config.folder._vscode,
      ...this.resources
    ];
    return resurces;
  }
  //#endregion

  // @ts-ignore
  get isWorkspaceChildProject(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isWorkspaceChildProject;
    }
    //#region @backend
    // if (!!this.parent && this.parent.isWorkspaceChildProject) { // QUICK_FIX for temporary projects
    //   return true;
    // }
    return !!this.parent && this.parent.typeIs('workspace');
    //#endregion
  }

  /**
   * Standalone project ready for publish on npm
   * Types of standalone project:
   * - isomorphic-lib : backend/fronded ts library with server,app preview
   * - angular-lib: frontend ui lib with angular preview
   */
  // @ts-ignore
  get isStandaloneProject(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isStandaloneProject;
    }
    //#region @backend
    if (this.typeIs('unknow')) {
      return false;
    }
    return (
      !this.isWorkspaceChildProject
      && !this.isWorkspace
      && !this.isContainer
      && !this.isUnknowNpmProject
      && !this.isDocker
    );
    //#endregion
  }

  //#region @backend
  // @ts-ignore
  get linkedFolders(this: Project) {
    return this.packageJson.linkedFolders;
  }
  //#endregion
  // @ts-ignore
  get dependsOn(this: Project): Project[] {
    //#region @backendFunc
    if (this.isWorkspace) {
      return this.packageJson.dependsOn.map(name => {
        const child = this.parent.child(name);
        if (!child) {
          Helpers.error(`Unknow baseline project "${name}" inside ${this.packageJson.path}`, false, true);
        }
        return child;
      }).filter(f => !!f);
    }
    return [];
    //#endregion
  }

  __cacheStandaloneDependencies: Project[];

  // @ts-ignore
  get workspaceDependencies(this: Project): Project[] {
    //#region @backendFunc
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
    } else if (this.isStandaloneProject) {
      if (!_.isUndefined(this.__cacheStandaloneDependencies)) {
        return this.__cacheStandaloneDependencies;
      }
      // const dependenciesNames = this.packageJson.dependencies();
      const dependenciesNames = this.packageJson.data?.tnp?.overrided?.includeOnly || []; // TODO NOT SURE
      const res = dependenciesNames.map(d => {
        const child = this.parent.children.find(f => f.name === d);
        return child;
      }).filter(f => !!f);
      this.__cacheStandaloneDependencies = res;
      return res;
    }

    return [];
    //#endregion
  }

  // @ts-ignore
  get workspaceDependenciesServers(this: Project): Project[] {
    //#region @backendFunc
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
    //#endregion
  }

  linkTo(this: Project, destPackageLocation: string) {
    //#region @backend
    Helpers.createSymLink(this.location, destPackageLocation);
    //#endregion
  }
}
