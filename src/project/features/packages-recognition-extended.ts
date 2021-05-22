//#region @backend
import { path } from 'tnp-core'
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

  start(force = false) {
    if (!global.globalSystemToolMode) {
      return;
    }
    Helpers.info(`[package-recognition] Searching isomorphic packages... force=${force} `);
    Helpers.mesureExectionInMsSync(`Searching isomorphic packages...`,()=> {
      super.start(true); // TODO QUICK_FIX
    })
    Helpers.info(`[package-recognition] Founded ${this.count} isomorphic packages`);
  }

  checkIsomorphic(node_modules: string, packageName: string) {
    const pjPath = fse.realpathSync(path.join(node_modules, packageName));
    let res = false;
    try {
      const proj = Project.From<Project>(pjPath);
      if (proj) {
        if (proj.typeIs(...(config.projectTypes.forNpmLibs as ConfigModels.LibType[]))) {
          // console.log(`Proj "${proj.genericName}" standalone`, proj.isStandaloneProject)
          res = proj.isStandaloneProject;
        } else {
          res = super.checkIsomorphic(node_modules, packageName);
        }
      }
    } catch (error) { }
    // console.log(`checkIsomorphic: "${packageName}"`, res)
    return res;
  }

}



//#endregion
