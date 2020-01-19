//#region @backend
import chalk from 'chalk';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as inquirer from 'inquirer';
import { config as configMorphi } from 'morphi';
//#endregion
import * as _ from 'lodash';
import * as json5 from 'json5';
import { config } from '../../../config';
import { Project } from './project';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { Morphi } from 'morphi';


//#region @backend
function reorderResult(result = [], update: (result) => void): boolean {
  let neededNextOrder = false;
  result.some((res, index, arr) => {
    return !_.isUndefined(result.find((res2, index2, arr2) => {
      if (res.name === res2.name) {
        return false;
      }
      if (!_.isUndefined(res.workspaceDependencies.find(wd => wd.name === res2.name))) {
        result = Helpers.arrays.arrayMoveElementBefore(result, res2, res);
        update(result);
        neededNextOrder = true;
        return true;
      }
      return false;
    }));
  });
  return neededNextOrder;
}
//#endregion



export abstract class FolderProject {

  abstract location: string;


  get children(this: Project): Project[] {
    if (Helpers.isBrowser) {
      return this.browser.children as any;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return [];
    }
    return this.getAllChildren()
    //#endregion
  }

  /**
   * children by sorted
   * example:
   * - first child should be build first, other depends on it
   * - next child depend on previous child (first child)
   * - next child depend on previous child..
   * etc......
   */
  //#region @backend
  get sortedRequiredWorkspaceChilds(this: Project): Project[] {
    if (!this.isWorkspaceChildProject) {
      return [];
    }
    // const libs = this.parent.childrenThatAreLibs;
    // console.log('this.parent.children', this.parent.children.map(c => c.name))
    // console.log('this.parent.childrenThatAreLibs', this.parent.childrenThatAreLibs.map(c => c.name))
    return this.libsForTraget(this).concat([this])
  }
  //#endregion


  //#region @backend

  libsForTraget(this: Project, project: Project) {
    return this.libs([{ project: project as any, appBuild: false }]).map(c => c.project);
  }

  libs(this: Project, targetClients: Models.dev.ProjectBuild[]) {
    const existed = {};
    const targetLibs = targetClients
      .map(t => ((t.project as any) as Project).workspaceDependencies)
      .reduce((a, b) => a.concat(b), [])
      .map(d => {
        if (!existed[d.name]) {
          existed[d.name] = d;
        }
        return d;
      })
      .filter(c => {
        if (existed[c.name]) {
          existed[c.name] = void 0;
          return true;
        }
        return false;
      })
      .sort((a, b) => {
        return a.workspaceDependencies.filter(c => c === b).length;
      });
    // console.log('targetClients', targetClients.map(l => l.project.genericName))
    // console.log('targetClients[0]', targetClients[0].project.workspaceDependencies.map(l => l.genericName))
    // console.log('targetClients[1]', targetClients[1].project.workspaceDependencies.map(l => l.genericName))
    // console.log('targetlibs', targetLibs.map(l => l.genericName))

    let result: Project[] = [];


    function recrusiveSearchForDependencies(lib: Project) {
      if (_.isUndefined(result.find(r => r.name === lib.name))) {
        result.push(lib);
      }
      if (lib.workspaceDependencies.length === 0) {
        return;
      }
      lib.workspaceDependencies
        .filter(f => {
          return _.isUndefined(result.find(r => r.name === f.name))
        })
        .forEach(d => {
          if (_.isUndefined(result.find(r => r.name === d.name))) {
            result.unshift(d);
          }
          recrusiveSearchForDependencies(d);
        });
    }
    targetLibs.forEach(lib => recrusiveSearchForDependencies(lib));

    let count = 0;
    let lastArr = [];
    while (reorderResult(result, r => { result = r; })) {
      // Helpers.log(`Sort(${++count}) \n ${result.map(c => c.genericName).join('\n')}\n `);
      if (_.isEqual(lastArr, result.map(c => c.name))) {
        break;
      }
      lastArr = result.map(c => c.name);
    }
    return result.map(c => {
      return { project: c, appBuild: false };
    });
  }
  //#endregion

  get childrenThatAreLibs(this: Project): Project[] {
    if (Helpers.isBrowser) {
      return this.browser.childrenThatAreLibs as any;
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
      return this.browser.childrenThatAreClients as any;
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
      Helpers.warn(`Project doesnt contain child with name: ${name}`)
    }
    return c;
  }
  //#endregion

  get parent(this: Project): Project {
    if (Helpers.isBrowser) {
      return this.browser.parent as any;
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

  //#region @backend
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
      subdirectories = subdirectories.concat(getDirectories(path.join(this.location, '../firedev-projects'))
        .filter(f => {
          const folderNam = path.basename(f);
          return (notAllowed.filter(p => p.test(folderNam)).length === 0);
        }))
    }
    return subdirectories;
  }
  //#endregion

  //#region @backend
  public clear(this: Project) {
    if (this.type === 'unknow') {
      return;
    }
    Helpers.log(`

    Cleaning project: ${this.genericName}

    `);
    this.node_modules.remove();
    this.reset(false)
  }
  //#endregion

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

  //#region @backend
  removeItself(this: Project) {
    const location = this.location;
    Project.projects = Project.projects.filter(p => p.location !== location);
    Helpers.tryRemoveDir(location);
  }
  //#endregion

  //#region @backend
  private clearNodeModulesFromLinks(this: Project) {
    if (!this.isStandaloneProject) {
      return;
    }
    Helpers.log(`Reseting symbolic links from node_mouels.. start..`);
    const node_modules = path.join(this.location, config.folder.node_modules);
    const folders = fse.readdirSync(node_modules);
    folders
      .map(f => path.join(node_modules, f))
      .filter(f => fse.lstatSync(f).isSymbolicLink())
      .forEach(f => {
        Helpers.log(`Deleting link  node_modules/${path.basename(f)}`);
        Helpers.remove(f);
      });
    Helpers.log(`Reseting symbolic links from node_mouels.. DONE `);
  }
  //#endregion

  //#region @backend
  public reset(this: Project, showMsg = true) {
    this.quickFixes.removeUncessesaryFiles();

    if (this.isWorkspace && this.isGenerated && this.isBasedOnOtherProject) {
      const siteLocationInDist = path.resolve(path.join('..', this.location, this.baseline.name));
      Helpers.tryRemoveDir(siteLocationInDist);
    }
    if (!this.isUnknowNpmProject && !this.isStandaloneProject) {
      Helpers.remove(path.join(this.location, config.folder.node_modules, config.file.tnpBundle))
    }
    if (this.type === 'unknow') {
      return;
    }
    if (showMsg) {
      Helpers.log(`

      Reseting project: ${this.genericName}

      `);
    }
    this.removeRecognizedIsomorphicLIbs();
    let gitginoredfiles = this.recreate.filesIgnoredBy.gitignore
      .map(f => f.startsWith('/') ? f.substr(1) : f)
      .filter(f => {
        if (f.startsWith('tsconfig.') && this.isTnp) {
          return false;
        }
        if (f === config.folder.node_modules) {
          return false;
        }
        if (config.filesNotAllowedToClean.includes(f)) {
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

    if (this.isCoreProject) {
      gitginoredfiles = gitginoredfiles.filter(f => {
        return [
          config.folder.node_modules
        ].map(c => `/${c}`).includes(f);
      })
    }

    for (let index = 0; index < gitginoredfiles.length; index++) {
      const head = gitginoredfiles[index].trim();
      const fileOrDirPath = path.join(this.location, head);
      if (!head.startsWith('**')) {
        Helpers.log(`Removing: "${head}"`)
        Helpers.remove(fileOrDirPath)
      }
    }
    if (this.isCoreProject) {
      Helpers.remove(`${this.location}/tmp*`);
      Helpers.remove(`${this.location}/browser-*`);
      Helpers.remove(`${this.location}/dist`);
    }
    this.clearNodeModulesFromLinks();
    this.quickFixes.missingSourceFolders()
  }
  //#endregion

  //#region @backend
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
  //#endregion

}


// export interface FolderProject extends Partial<Project> { }
