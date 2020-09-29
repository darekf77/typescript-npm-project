//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import { config as configMorphi } from 'morphi';
//#endregion
import * as _ from 'lodash';
import { config } from 'tnp-config';
import type { Project } from './project';
import { Helpers, Project as $Project } from 'tnp-helpers';
import { Models } from 'tnp-models';

export abstract class FolderProject {

  abstract location: string;

  //#region @backend
  get sourceFolder(this: Project): 'src' | 'components' {
    return (this.typeIs('angular-lib')
      ? config.folder.components : config.folder.src) as any;
  }
  //#endregion

  get children(this: Project): Project[] {
    if (Helpers.isBrowser) {
      return this.browser.children as any;
    }
    //#region @backend

    if (this.isTnp && !global.globalSystemToolMode) {
      return [];
    }
    if (this.typeIs('unknow')) {
      return [];
    }
    return this.getAllChildren()
    //#endregion
  }

  get childrenThatAreLibs(this: Project): Project[] {
    if (Helpers.isBrowser) {
      return this.browser.childrenThatAreLibs as any;
    }
    //#region @backend
    if (this.typeIs('unknow')) {
      return [];
    }
    return this.children.filter(c => {
      return c.typeIs(...([
        'angular-lib',
        'isomorphic-lib'
      ] as Models.libs.LibType[]));
    });
    //#endregion
  }

  get childrenThatAreClients(this: Project): Project[] {
    if (Helpers.isBrowser) {
      return this.browser.childrenThatAreClients as any;
    }
    //#region @backend
    if (this.typeIs('unknow')) {
      return [];
    }
    return this.children.filter(c => {
      return c.typeIs(...([
        'angular-lib',
        'isomorphic-lib',
        'angular-client',
        'ionic-client',
      ] as Models.libs.LibType[]));
    });
    //#endregion
  }

  //#region @backend
  private getAllChildren(this: Project, options?: { excludeUnknowProjects: boolean; }) {
    if (this.typeIs('unknow')) {
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
        return $Project.From<Project>(dir);
      })
      .filter(c => !!c)

    if (excludeUnknowProjects) {
      res = res.filter(c => {
        const isNot = c.typeIsNot('unknow');
        // if (!isNot) {
        //   console.log(`KURWA ${isNot}`)
        // }
        return isNot;
      })
    }
    return res;
  }
  //#endregion

  //#region @backend
  replaceSourceForStandalone(this: Project) {
    [
      config.folder.src,
      config.folder.components,
    ].forEach(folderName => {
      const orgSource = path.join(this.location, folderName);
      Helpers.removeFolderIfExists(orgSource);
      const standalone = path.join(this.location, `${folderName}-for-standalone`);
      if (Helpers.exists(standalone)) {
        Helpers.move(standalone, orgSource)
      }
    })
  }
  removeStandaloneSources(this: Project) {
    [
      config.folder.src,
      config.folder.components,
    ].forEach(folderName => {
      const standalone = path.join(this.location, `${folderName}-for-standalone`);
      Helpers.removeFolderIfExists(standalone);
    })
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
    const parent = $Project.From<Project>(path.join(this.location, '..'));
    if (parent && parent.isWorkspaceChildProject && this.isWorkspaceChildProject) { // QUICK_FIX for temporary projects
      return parent.parent;
    }
    return parent
    //#endregion
  }

  get grandpa(this: Project): Project {
    if (Helpers.isBrowser) {
      return this.browser.grandpa as any;
    }
    //#region @backend
    if (!_.isString(this.location) || this.location.trim() === '') {
      return void 0;
    }
    const grandpa = $Project.From<Project>(path.join(this.location, '..', '..'));
    return grandpa;
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

    if (this.isTnp && fse.existsSync(path.join(this.location, '../firedev-projects'))) {
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
  public async clear(this: Project) {
    if (this.typeIs('unknow')) {
      return;
    }
    Helpers.info(`

    Cleaning project: ${this.genericName}

    `);
    this.node_modules.remove();
    await this.reset(false)
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
  removeFileByRelativePath(this: Project, relativePathToFile: string) {
    relativePathToFile = relativePathToFile.replace(/^\//, '')
    const location = this.location;
    const p = path.join(location, relativePathToFile);
    Helpers.removeFileIfExists(p);
  }
  removeFolderByRelativePath(this: Project, relativePathToFolder: string) {
    relativePathToFolder = relativePathToFolder.replace(/^\//, '')
    const location = this.location;
    const p = path.join(location, relativePathToFolder);
    Helpers.removeFolderIfExists(p);
  }
  //#endregion

  //#region @backend
  private clearNodeModulesFromLinks(this: Project) {
    if (!this.isStandaloneProject) {
      return;
    }
    Helpers.log(`Reseting symbolic links from node_mouels.. start..`);
    const node_modules = path.join(this.location, config.folder.node_modules);
    const folders = !fse.existsSync(node_modules) ? [] : fse.readdirSync(node_modules);
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
  public async reset(this: Project, showMsg = true) {
    await this.compilerCache.unsetData()
    this.quickFixes.removeUncessesaryFiles();

    if (this.isWorkspace && this.isGenerated && this.isBasedOnOtherProject) {
      const siteLocationInDist = path.resolve(path.join('..', this.location, this.baseline.name));
      Helpers.tryRemoveDir(siteLocationInDist);
    }
    if (this.typeIs('unknow')) {
      return;
    }
    if (showMsg) {
      Helpers.info(`

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
    if (this.typeIs('unknow')) {
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

  //#region @backend
  notAllowedFiles() {
    return [

    ]
  }
  //#endregion

}


// export interface FolderProject extends Partial<Project> { }
