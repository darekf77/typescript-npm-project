//#region @backend
import { path, crossPlatformPath } from 'tnp-core'
import { fse } from 'tnp-core'
import { PackagesRecognition, BrowserCodeCut } from 'morphi';
import { Project } from '../abstract';
import { Helpers } from 'tnp-helpers';
import { config, ConfigModels } from 'tnp-config';
import { Models } from 'tnp-models';


export class PackagesRecognitionExtended extends PackagesRecognition {


  public static fromProject(project: Project) {
    return new PackagesRecognitionExtended(project.location);
  }

  // @ts-ignore
  start(force: boolean, reasonToSearch: string) {
    Helpers.log(`[morphi] ${reasonToSearch}`);
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
      super.start(true, reasonToSearch); // TODO QUICK_FIX
    });
    Helpers.info(`[${config.frameworkName}] [package-recognition] Founded ${this.count} isomorphic packages`);
  }

  checkIsomorphic(node_modules: string, packageName: string) {
    const pjPath = crossPlatformPath(fse.realpathSync(path.join(node_modules, packageName)));
    let res = false;
    try {
      Helpers.log(`[${config.frameworkName}][checkIsomorphic] check project from ${pjPath}`)
      const proj = Project.From<Project>(pjPath);
      if (proj) {
        Helpers.log(`[${config.frameworkName}] Proj "${proj.genericName}" type ${proj._type}, standalone ${proj.isStandaloneProject}`)
        if (proj.typeIs(...(config.projectTypes.forNpmLibs as ConfigModels.LibType[]))) {
          res = proj.isStandaloneProject;
        } else {
          res = super.checkIsomorphic(node_modules, packageName);
        }
      }
    } catch (error) {
      Helpers.log(`[${config.frameworkName}][pacakge-recognition] Not able to check ${pjPath}`)
    }
    // console.log(`checkIsomorphic: "${packageName}"`, res)
    return res;
  }

}



//#endregion
