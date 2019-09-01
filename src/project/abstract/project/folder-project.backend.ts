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


export abstract class FolderProject {

  abstract location: string;


  get children(this: Project): Project[] {
    if (Helpers.isBrowser) {
      return this.browser.children;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return [];
    }
    return this.getAllChildren()
    //#endregion
  }

  get childrenThatAreLibs(this: Project): Project[] {
    if (Helpers.isBrowser) {
      return this.browser.childrenThatAreLibs;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return [];
    }
    return this.children.filter(c => {
      return ([
        'angular-lib',
        'isomorphic-lib'
      ] as Models.libs.LibType[]).includes(c.type);
    });
    //#endregion
  }

  get childrenThatAreClients(this: Project): Project[] {
    if (Helpers.isBrowser) {
      return this.browser.childrenThatAreClients;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return [];
    }
    return this.children.filter(c => {
      return ([
        'angular-lib',
        'isomorphic-lib',
        'angular-client',
        'ionic-client',
      ] as Models.libs.LibType[]).includes(c.type);
    });
    //#endregion
  }

  //#region @backend
  getAllChildren(this: Project, options?: { excludeUnknowProjects: boolean; }) {
    if (this.type === 'unknow') {
      return [];
    }
    if (_.isUndefined(options)) {
      options = {} as any;
    }
    if (_.isUndefined(options.excludeUnknowProjects)) {
      options.excludeUnknowProjects = true;
    }
    const { excludeUnknowProjects } = options;
    const subdirectories = this.getFolders();

    let res = subdirectories
      .map(dir => {
        // log('child:', dir)
        return Project.From(dir);
      })
      .filter(c => !!c)

    if (excludeUnknowProjects) {
      res = res.filter(c => c.type !== 'unknow-npm-project')
    }
    return res;
  }
  //#endregion

  //#region @backend
  child(this: Project, name: string, errors = true): Project {
    const c = this.children.find(c => c.name === name);
    if (errors && !c) {
      Helpers.error(`Project doesnt contain child with name: ${name}`)
    }
    return c;
  }
  //#endregion

  get parent(this: Project): Project {
    if (Helpers.isBrowser) {
      return this.browser.parent;
    }
    //#region @backend
    if (!_.isString(this.location) || this.location.trim() === '') {
      return void 0;
    }
    const parent = Project.From(path.join(this.location, '..'));
    if (parent && parent.isWorkspaceChildProject && this.isWorkspaceChildProject) { // QUICK_FIX for temporary projects
      return parent.parent;
    }
    return parent
    //#endregion
  }

  getFolders(this: Project) {
    const notAllowed: RegExp[] = [
      '^\.vscode$', '^node\_modules$',
      ..._.values(config.tempFolders).map(v => `^${v}$`),
      '^e2e$', '^tmp.*', '^dist.*', '^tests$', '^module$', '^browser', 'bundle*',
      '^components$', '\.git', '^bin$', '^custom$'
    ].map(s => new RegExp(s))

    const isDirectory = source => fse.lstatSync(source).isDirectory()
    const getDirectories = source =>
      fse.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)

    let subdirectories = getDirectories(this.location)
      .filter(f => {
        const folderNam = path.basename(f);
        return (notAllowed.filter(p => p.test(folderNam)).length === 0);
      })

    if (this.isTnp) {
      subdirectories = subdirectories.concat(getDirectories(path.join(this.location, config.folder.projects))
        .filter(f => {
          const folderNam = path.basename(f);
          return (notAllowed.filter(p => p.test(folderNam)).length === 0);
        }))
    }
    return subdirectories;
  }

  public clear(this: Project) {
    if (this.type === 'unknow') {
      return;
    }
    Helpers.log(`Cleaning project: ${this.genericName}`);
    this.node_modules.remove();
    this.reset(false)
  }

  //#region @backend
  private _path(this: Project, relativePath: string, currentProjectLocation?: string) {
    if (_.isUndefined(currentProjectLocation)) {
      currentProjectLocation = this.location;
    }
    return {
      normal: path.join(currentProjectLocation, relativePath),
      custom: path.join(currentProjectLocation, config.folder.custom, relativePath),
      __prefixed: path.join(currentProjectLocation, path.dirname(relativePath), `__${path.basename(relativePath)}`),
    }
  }

  path(this: Project, relativePath: string, currentProjectLocation?: string) {

    const self = this;
    return {
      get relative() {
        return self._path(relativePath, '');
      },
      get absolute() {
        return self._path(relativePath);
      }
    }
  }

  //#endregion



  //#region @backend
  containsFile(this: Project, filePaht: string) {
    let fullPath = path.resolve(path.join(this.location, filePaht));
    let res = fse.existsSync(fullPath)
    // if (!res && process.platform === 'darwin') {
    //   fullPath = path.join('/private', fullPath);
    //   res = fse.existsSync(fullPath);
    // }
    // log(`res: ${res} : ${fullPath}`)
    return res;
  }
  //#endregion

  removeItself(this: Project) {
    const location = this.location;
    Project.projects = Project.projects.filter(p => p.location !== location);
    Helpers.tryRemoveDir(location);
  }

  public reset(this: Project, showMsg = true) {
    if (this.isWorkspace && this.isGenerated && this.isBasedOnOtherProject) {
      const siteLocationInDist = path.resolve(path.join('..', this.location, this.baseline.name));
      Helpers.tryRemoveDir(siteLocationInDist);
    }
    if (this.type === 'unknow') {
      return;
    }
    if (showMsg) {
      Helpers.log(`Reseting project: ${this.genericName}`);
    }
    this.removeRecognizedIsomorphicLIbs();
    let gitginoredfiles = this.recreate.filesIgnoredBy.gitignore
      .map(f => f.startsWith('/') ? f.substr(1) : f)
      .filter(f => {
        if (f === config.folder.node_modules) {
          return false;
        }
        if (config.filesNotAllowedToClen.includes(f)) {
          return false;
        }
        if (f.startsWith(config.folder.bundle) && this.isTnp) {
          return false;
        }
        return true;
      })
    if (this.isWorkspace) {
      gitginoredfiles = gitginoredfiles.filter(f => !f.startsWith(config.folder.dist))
    }

    for (let index = 0; index < gitginoredfiles.length; index++) {
      const head = gitginoredfiles[index].trim();
      const fileOrDirPath = path.join(this.location, head);
      if (!head.startsWith('**')) {
        Helpers.log(`Removing: "${head}"`)
        rimraf.sync(fileOrDirPath)
      }
    }
    this.quickFixes.missingSourceFolders()
  }

  removeRecognizedIsomorphicLIbs(this: Project) {
    if (this.type === 'unknow') {
      return;
    }
    try {
      const pjPath = path.join(this.location, config.file.package_json);
      const pj: Models.npm.IPackageJSON = fse.readJsonSync(pjPath, {
        encoding: 'utf8'
      });
      pj[configMorphi.array.isomorphicPackages] = void 0;
      fse.writeJsonSync(pjPath, pj, {
        encoding: 'utf8',
        spaces: 2
      });
    } catch (e) {

    }
  }

}


// export interface FolderProject extends Partial<Project> { }
