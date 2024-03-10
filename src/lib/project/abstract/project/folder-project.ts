//#region @backend
import { fse, crossPlatformPath, glob } from 'tnp-core/src';
import { path } from 'tnp-core/src';
//#endregion
import { _ } from 'tnp-core/src';
import { config, ConfigModels } from 'tnp-config/src';
import { Project } from './project';
import { Helpers, Project as $Project } from 'tnp-helpers/src';
import { Models } from 'tnp-models/src';
import { MESSAGES } from '../../../constants';
const forStandAloneSrc = `${config.folder.src}-for-standalone`;
export abstract class FolderProject {

  abstract location: string;

  //#region @backend

  // @ts-ignore
  get linkedProjectsExisted(this: Project): Project[] {
    return this.packageJson.linkedProjects
      .filter(f => !Helpers.isValidGitRepuUrl(f))
      .sort()
      .map(f => {
        const p = path.join(this.location, f);
        const proj = $Project.From(p) as Project;
        return proj;
      })
      .filter(f => !!f)
  }
  //#endregion

  hasChild(this: Project, child: Project) {
    return !_.isUndefined(this.children.find(c => c.name === child?.name));
  }

  // @ts-ignore
  get smartContainerBuildTarget(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.smartContainerBuildTarget as any;
    }
    //#region @backend
    const children = this.children;
    let target = children
      .filter(c => c.typeIs('isomorphic-lib'))
      .find(c => c.name === this.packageJson.smartContainerBuildTarget);

    if (!target && children.length === 1) {
      target = _.first(children);
    }

    return target;
    //#endregion
  }

  // @ts-ignore
  get children(this: Project): Project[] {
    if (Helpers.isBrowser) {
      return this.browser.children as any;
    }
    //#region @backend

    if (this.pathExists('taon.json')) {
      const taonChildren = Helpers.foldersFrom(this.location)
        .filter(f => !f.startsWith('.') && ![
          config.folder.node_modules,
        ].includes(path.basename(f)))
        .map(f => Project.From(f) as Project)
        .filter(f => !!f);
      // console.log({
      //   taonChildren: taonChildren.map(c => c.location)
      // })
      return taonChildren;
    }

    if (this.isTnp && !global.globalSystemToolMode) {
      return [];
    }
    if (this.typeIs('unknow')) {
      return [];
    }
    const all = this.getAllChildren();
    // console.log({
    //   all: all.map(c => c.location)
    // })
    return all;
    //#endregion
  }

  // @ts-ignore
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
        'isomorphic-lib'
      ] as ConfigModels.LibType[]));
    });
    //#endregion
  }

  // @ts-ignore
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
        'isomorphic-lib',
      ] as ConfigModels.LibType[]));
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
        // console.log('child:', dir)
        return $Project.From<Project>(dir);
      })
      .filter(c => !!c)

    if (excludeUnknowProjects) {
      res = res.filter(c => {
        const isNot = c.typeIsNot('unknow');

        return isNot;
      })
    }
    return res;
  }
  //#endregion



  addSourcesFromCore(this: Project) {
    const corePath = Project.by(this._type, this._frameworkVersion).location

    const srcInCore = path.join(corePath, config.folder.src);
    const srcForStandAloenInCore = path.join(corePath, forStandAloneSrc);

    const dest = path.join(this.location, config.folder.src);
    const destForStandalone = path.join(this.location, forStandAloneSrc);

    if (Helpers.exists(srcInCore)) {
      Helpers.copy(srcInCore, dest, { recursive: true, overwrite: true });
    }

    if (Helpers.exists(srcForStandAloenInCore)) {
      Helpers.copy(srcForStandAloenInCore, destForStandalone, { recursive: true, overwrite: true });
    }
  }

  //#region @backend
  replaceSourceForStandalone(this: Project) {

    const folderName = config.folder.src;
    const orgSource = path.join(this.location, folderName);
    Helpers.removeFolderIfExists(orgSource);
    const standalone = path.join(this.location, forStandAloneSrc);
    if (Helpers.exists(standalone)) {
      Helpers.move(standalone, orgSource)
    }

  }
  removeStandaloneSources(this: Project) {
    const standalone = path.join(this.location, forStandAloneSrc);
    Helpers.removeFolderIfExists(standalone);
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

  // @ts-ignore
  get parent(this: Project): Project {
    if (Helpers.isBrowser) {
      return this.browser.parent as any;
    }
    //#region @backend
    if (!_.isString(this.location) || this.location.trim() === '') {
      return void 0;
    }
    const parent = $Project.From<Project>(path.join(this.location, '..'));
    // if (parent && parent.isWorkspaceChildProject && this.isWorkspaceChildProject) { // QUICK_FIX for temporary projects
    //   return parent.parent;
    // }
    return parent;
    //#endregion
  }

  // @ts-ignore
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
    const isDirectory = source => fse.lstatSync(source).isDirectory()
    const getDirectories = source =>
      fse.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)

    let subdirectories = getDirectories(this.location)
      .filter(f => {
        const folderName = path.basename(f);
        return Helpers.checkIfNameAllowedForFiredevProj(folderName);
      })

    if (this.isTnp && fse.existsSync(path.join(this.location, '../firedev-projects'))) {
      subdirectories = subdirectories.concat(getDirectories(path.join(this.location, '../firedev-projects'))
        .filter(f => {
          const folderName = path.basename(f);
          return Helpers.checkIfNameAllowedForFiredevProj(folderName);
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
    Helpers.info(`Cleaning project: ${this.genericName}`);
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
      /**
       * Normal path as you expect
       * <absolute path to project> / < relative path from param >
       */
      normal: crossPlatformPath(path.join(currentProjectLocation, relativePath)),
      custom: crossPlatformPath(path.join(currentProjectLocation, config.folder.custom, relativePath)),
      __prefixed: crossPlatformPath(path.join(currentProjectLocation, path.dirname(relativePath),
        `__${path.basename(relativePath)}`)),
    }
  }

  pathFor(relativePath: string | string[]) {
    if (Array.isArray(relativePath)) {
      relativePath = crossPlatformPath(relativePath.join('/'))
    }
    if (path.isAbsolute(relativePath)) {
      Helpers.error(`Cannot join relative path with absolute: ${relativePath}`);
    }
    return crossPlatformPath(path.join(this.location, relativePath))
  }


  /**
   * same has project.hasFile();
   */
  pathExists(relativePath: string | string[]): boolean {
    return this.hasFile(relativePath);
  }

  /**
   * same as project.pathExists();
   */
  hasFile(relativePath: string | string[]): boolean {
    return Helpers.exists(this.pathFor(relativePath));
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
  containsFile(this: Project, fileRelativeToProjectPath: string) {
    const fullPath = path.resolve(path.join(this.location, fileRelativeToProjectPath));
    return Helpers.exists(fullPath);
  }

  removeFile(this: Project, fileRelativeToProjectPath: string) {
    const fullPath = path.resolve(path.join(this.location, fileRelativeToProjectPath));
    return Helpers.removeFileIfExists(fullPath);
  }

  containsFolder(this: Project, filePaht: string) {
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
    Helpers.remove(p, true);
  }
  //#endregion

  //#region @backend
  private clearNodeModulesFromLinks(this: Project) {
    if (!this.isStandaloneProject) {
      return;
    }
    Helpers.log(`Reseting symbolic links from node_mouels..start..`);
    const node_modules = path.join(this.location, config.folder.node_modules);
    const folders = !fse.existsSync(node_modules) ? [] : fse.readdirSync(node_modules);
    folders
      .map(f => path.join(node_modules, f))
      .filter(f => fse.lstatSync(f).isSymbolicLink())
      .forEach(f => {
        Helpers.log(`Deleting link  node_modules / ${path.basename(f)}`);
        Helpers.remove(f);
      });
    Helpers.log(`Reseting symbolic links from node_mouels..DONE`);
  }
  //#endregion

  //#region @backend
  public async reset(this: Project, showMsg = true) {
    await this.compilerCache.unsetData()
    this.quickFixes.removeUncessesaryFiles();

    glob.sync(`${this.location}/*.filetemplate`).forEach(fileTemplate => {
      Helpers.remove(fileTemplate);
      Helpers.remove(fileTemplate.replace('.filetemplate', ''));
    });

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
        // if (f.startsWith(config.folder.dist) && this.isTnp) { // @LAST
        //   return false;
        // }
        return true;
      })

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
        if (process.platform === 'win32') {
          while (true) {
            try {
              Helpers.remove(fileOrDirPath);
              break;
            } catch (error) {
              // TODO last notification to user
              Helpers.pressKeyAndContinue(MESSAGES.SHUT_DOWN_FOLDERS_AND_DEBUGGERS)
            }
          }
        } else {
          Helpers.remove(fileOrDirPath)
        }

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
      pj[config.array.isomorphicPackages] = void 0;
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

  //#region @backend
  writeFile(this: Project, relativePath: string, content: string) {
    Helpers.writeFile([this.location, relativePath], content);
  }

  //#endregion

}


// export interface FolderProject extends Partial<Project> { }
