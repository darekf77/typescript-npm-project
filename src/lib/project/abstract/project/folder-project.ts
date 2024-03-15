//#region @backend
import { fse, crossPlatformPath, glob } from 'tnp-core/src';
import { path } from 'tnp-core/src';
//#endregion
import { _ } from 'tnp-core/src';
import { config, ConfigModels } from 'tnp-config/src';
import { Project } from './project';
import { Helpers } from 'tnp-helpers/src';
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
        const proj = Project.From(p);
        return proj;
      })
      .filter(f => !!f)
  }
  //#endregion

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

  addSourcesFromCore(this: Project) {
    const corePath = Project.by(this.type, this._frameworkVersion).location

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
