//#region @backend
import {
  _,
  path,
  fse,
  crossPlatformPath,
} from 'tnp-core';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { BrowserCodeCut } from '../../compilers/build-isomorphic-lib/code-cut/browser-code-cut.backend';
import type { Project } from '../../abstract/project/project';

export class PackagesRecognition {

  static FILE_NAME_ISOMORPHIC_PACKAGES = config.tempFiles.FILE_NAME_ISOMORPHIC_PACKAGES;

  private static cached: { [location: string]: PackagesRecognition; } = {} as any;

  public static fromProject(project: Project, cached = false) {
    if (cached && !!project?.location && !this.cached[project?.location]) {
      this.cached[project?.location] = new PackagesRecognition(project.location, project);
    }
    if (cached && !!project?.location) {
      const instance = this.cached[project?.location] as PackagesRecognition;

      return instance;
    }
    return new PackagesRecognition(project.location, project);
  }

  protected recognizedPackages: string[];
  private processAlreadyDone = false;
  constructor(protected cwd: string, protected project?: Project) {

  }

  get count() {
    return _.isArray(this.recognizedPackages) ? this.recognizedPackages.length : 0;
  }

  // @ts-ignore
  start(force?: boolean, reasonToSearch?: string) {
    if (this.processAlreadyDone) {
      this.updateCurrentIsomorphicJsonSearchResults();
      Helpers.log(`[package-recognition] Searching isomorphic packages for ${this.project.genericName}...`
        + ` ommiting, updating from cache`);
      return;
    }
    Helpers.log(`[${config.frameworkName}] reason to search ${reasonToSearch}`);
    if (typeof force !== 'boolean') {
      force = false;
    }
    if (!global.globalSystemToolMode) {
      return;
    }

    Helpers.log(`[package-recognition] Searching isomorphic packages for ${this.project.genericName}... force=${force}
    in ${this.cwd}
    `);
    Helpers.mesureExectionInMsSync(`Searching isomorphic packages for ${this.project.genericName}...`, () => {
      let local = [];
      if (this.project.isSmartContainer || this.project.isSmartContainerTarget) {
        const parent = this.project.isSmartContainer ? this.project
          : this.project.smartContainerTargetParentContainer;

        local = [
          ...parent.children.map(c => {
            return `@${parent.name}/${c.name}`
          })
        ]
      }
      this.superStart(true, reasonToSearch, local); // TODO QUICK_FIX

    });
    Helpers.log(`[${config.frameworkName}] [package-recognition] Founded ${this.count} isomorphic packages`);
    this.processAlreadyDone = true;
  }

  // checkIsomorphic(node_modules: string, packageName: string) {
  //   const packageInNodeModulesPath = crossPlatformPath(fse.realpathSync(path.join(node_modules, packageName)));
  //   let res = false;
  //   try {
  //     Helpers.log(`[${config.frameworkName}][checkIsomorphic] check project from ${packageInNodeModulesPath}`, 1);
  //     // if(Helpers.isSymlinkFileExitedOrUnexisted(packageInNodeModulesPath)) {

  //     // } else {

  //     // }
  //     const proj = Project.From<Project>(packageInNodeModulesPath);
  //     if (proj) {
  //       Helpers.log(`[${config.frameworkName}] Proj "${proj.genericName}" type ${proj._type}, standalone ${proj.isStandaloneProject}`, 1)
  //       if (proj.typeIs('isomorphic-lib')) {
  //         res = proj.isStandaloneProject;
  //       } else {
  //         res = super.checkIsomorphic(node_modules, packageName);
  //       }
  //     }
  //   } catch (error) {
  //     Helpers.log(`[${config.frameworkName}][pacakge-recognition] Not able to check ${packageInNodeModulesPath}`)
  //   }
  //   // console.log(`checkIsomorphic: "${packageName}"`, res)
  //   return res;
  // }


  superStart(force?: boolean, reasonToSearch?: string, local: string[] = []) {
    Helpers.log(`[${config.frameworkName}][force = ${force}] ${reasonToSearch}`);
    const pjPath = crossPlatformPath(path.join(this.cwd, config.tempFiles.FILE_NAME_ISOMORPHIC_PACKAGES));
    if (!Helpers.exists(pjPath)) {
      Helpers.writeJson(pjPath, {});
    }
    if (!force) {
      try {
        const pj = Helpers.readJson(pjPath);
        if (_.isArray(pj[config.array.isomorphicPackages])) {
          this.recognizedPackages = pj[config.array.isomorphicPackages];
          BrowserCodeCut.resolveAndAddIsomorphicLibs(_.cloneDeep(this.recognizedPackages));
          Helpers.log(`[${config.frameworkName}] Recognized (${this.recognizedPackages}) in ${pjPath}`)
          return;
        }
      } catch (error) {
        Helpers.log(`[${config.frameworkName}] ERROR not recognized in`)
      }
    }
    const node_modules = crossPlatformPath(path.join(this.cwd, config.folder.node_modules));

    const linksToFolders = Helpers.linksToFolderFrom(node_modules);

    let folders = [
      ...Helpers.foldersFrom(node_modules).reduce((a, b) => {
        if (path.basename(b).startsWith('@')) {
          const foldersFromB = Helpers.foldersFrom(b)
            .filter(f => ![config.folder.browser].includes(path.basename(f)))
            .map(f => {
              return `${path.basename(b)}/${path.basename(f)}`;
            });
          return [
            ...a,
            ...foldersFromB,
          ]
        }
        return [
          ...a,
          b
        ]
      }, []),
      ...linksToFolders,
    ] as string[];

    folders = folders
      .map(f => {
        if (f.startsWith('@')) {
          return f;
        }
        return path.basename(f);
      })
      .filter(packageName => {
        Helpers.log(`[${config.frameworkName}] Checking package node_modules/${packageName}`, 2)
        // try {
        return this.checkIsomorphic(node_modules, packageName);
        // } catch (error) {
        //   return false;
        // }
      });
    this.recognizedPackages = [
      ...folders,
      ...local,
      ...Object.values(config.frameworkNames),
    ];
    this.updateCurrentIsomorphicJsonSearchResults()
  }

  protected updateCurrentIsomorphicJsonSearchResults() {
    Helpers.log(`[${config.frameworkName}] updateCurrentPackageJson`)
    try {
      const pjPath = crossPlatformPath(path.join(this.cwd, config.tempFiles.FILE_NAME_ISOMORPHIC_PACKAGES));
      if (!Helpers.exists(pjPath)) {
        Helpers.writeJson(pjPath, {});
      }
      const pj = Helpers.readJson(pjPath);
      pj[config.array.isomorphicPackages] = this.recognizedPackages;
      Helpers.writeJson(pjPath, pj);
      BrowserCodeCut.resolveAndAddIsomorphicLibs(_.cloneDeep(this.recognizedPackages));
    } catch (e) {
      Helpers.log(`[${config.frameworkName}]`, e)
      Helpers.log(`[${config.frameworkName}] Error during update ismorphic packages list cache`);
    }
  }

  protected checkIsomorphic(node_modules: string, packageName: string) {
    let isIsomorphic = false;
    const packageInNodeModulesPath = crossPlatformPath(fse.realpathSync(path.join(node_modules, packageName)));
    const browser = crossPlatformPath(path.join(packageInNodeModulesPath, config.folder.browser));
    const websql = crossPlatformPath(path.join(packageInNodeModulesPath, config.folder.websql));
    isIsomorphic = (Helpers.exists(browser) || Helpers.exists(websql));
    if (isIsomorphic && !Helpers.exists(websql)) {
      Helpers.removeIfExists(websql);
      Helpers.createSymLink(browser, websql);
    }
    return isIsomorphic;
  }

}
//#endregion
