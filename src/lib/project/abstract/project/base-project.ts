//#region @backend
import chalk from 'chalk';
export { ChildProcess } from 'child_process';
import { path } from 'tnp-core/src';
//#endregion
import { _ } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { Project } from './project';
import { config } from 'tnp-config/src';

export abstract class BaseProject {

  // @ts-ignore
  public get npmPackageName(this: Project): string {
    if (this.isSmartContainerChild) {
      return `@${this.parent.name}/${this.name}`;
    }
    return `${this.name}`;
  }

  // @ts-ignore
  public get npmPackageNameAndVersion(this: Project): string {
    return `${this.npmPackageName}@${this.version}`;
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

    let result = [];
    if (this.isSmartContainerTarget) {
      // result = [
      //   this.smartContainerTargetParentContainer.name,
      //   this.name,
      // ]
      result = result.concat(this.findParentsNames(this.smartContainerTargetParentContainer));
    } else {
      result = result.concat(this.findParentsNames(this));
    }

    if (this.isSmartContainerTarget) {
      result.push(this.smartContainerTargetParentContainer.name);
    }
    result.push(this.name);
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
  get isSmartContainerTarget(this: Project) {
    const folderBefore = path.basename(path.dirname(path.dirname(this.location)));
    return [config.folder.dist, config.folder.bundle].includes(folderBefore)
      && this.smartContainerTargetParentContainer?.isSmartContainer;
  }

  // @ts-ignore
  get isSmartContainerTargetNonClient(this: Project) {
    const parent = this.smartContainerTargetParentContainer;
    return !!(parent?.isSmartContainer && parent.smartContainerBuildTarget?.name !== this.name);
  }

  // @ts-ignore
  get smartContainerTargetParentContainer(this: Project) {
    return Project.From(path.dirname(path.dirname(path.dirname(this.location)))) as Project;
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
  get sshOnly(this: Project) {
    return this.packageJson.sshOnly;
  }

  // @ts-ignore
  get isSmartContainerChild(this: Project) {
    return !!this.parent?.isSmartContainer;
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

  //#region @backend
  // @ts-ignore
  get allResources(this: Project) {
    const resurces = [
      config.file.package_json,
      'tsconfig.json',
      'tsconfig.browser.json',
      'tsconfig.isomorphic.json',
      'tsconfig.isomorphic-flat-bundle.json',
      'tsconfig.isomorphic-flat-dist.json',
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
    return (!this.isContainer
      && !this.isUnknowNpmProject
      && !this.isDocker
    );
    //#endregion
  }

  // @ts-ignore
  get isMonorepo(this: Project) {
    //#region @backendFunc
    return this.packageJson.isMonorepo;
    //#endregion
  }

  //#region @backend
  // @ts-ignore
  get linkedFolders(this: Project) {
    return this.packageJson.linkedFolders;
  }
  //#endregion



  // @ts-ignore
  get workspaceDependencies(this: Project): Project[] {
    //#region @backendFunc
    if (this.typeIs('unknow')) {
      return [];
    }
    if (this.isStandaloneProject) {
      // const dependenciesNames = this.packageJson.dependencies();
      const dependenciesNames = this.packageJson.data?.tnp?.overrided?.includeOnly || []; // TODO NOT SURE
      const res = dependenciesNames.map(d => {
        const child = this.parent.children.find(f => f.name === d);
        return child;
      }).filter(f => !!f);
      return res;
    }

    return [];
    //#endregion
  }

  linkTo(this: Project, destPackageLocation: string) {
    //#region @backend
    Helpers.createSymLink(this.location, destPackageLocation);
    //#endregion
  }
}
