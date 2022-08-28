//#region @backend
import { path, crossPlatformPath } from 'tnp-core'
import { fse } from 'tnp-core'
import { Project } from '../abstract';
import { Helpers } from 'tnp-helpers';
import { config, ConfigModels } from 'tnp-config';
import { Models } from 'tnp-models';
import { PackagesRecognition } from '../compilers/build-isomorphic-lib/packages-recognition';


export class PackagesRecognitionExtended extends PackagesRecognition {

  constructor(protected cwd: string, protected project: Project) {
    super(cwd);
  }

  public static fromProject(project: Project) {
    return new PackagesRecognitionExtended(project.location, project);
  }

  // @ts-ignore
  start(force: boolean, reasonToSearch: string) {
    Helpers.log(`[${config.frameworkName}] ${reasonToSearch}`);
    if (typeof force !== 'boolean') {
      force = false;
    }
    if (!global.globalSystemToolMode) {
      return;
    }
    Helpers.info(`[package-recognition] Searching isomorphic packages... force=${force}
    in ${this.cwd}
    `);
    Helpers.mesureExectionInMsSync(`Searching isomorphic packages...`, () => {
      let local = [];
      if (this.project.isSmartContainer || this.project.isSmartContainerTarget) {
        const parent = this.project.isSmartContainer ? this.project
          : Project.From(this.project.smartContainerTargetParentContainerPath);

        local = [
          ...parent.children.map(c => {
            return `@${parent.name}/${c.name}`
          })
        ]
      }
      super.start(true, reasonToSearch, local); // TODO QUICK_FIX

    });
    Helpers.info(`[${config.frameworkName}] [package-recognition] Founded ${this.count} isomorphic packages`);
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

}



//#endregion
