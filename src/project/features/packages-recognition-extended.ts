//#region @backend
import * as path from 'path';
import * as fse from 'fs-extra';
import { PackagesRecognition } from 'morphi';
import { Project } from '../abstract';
import { Helpers } from '../../helpers';
import { config } from '../../config';
import { Models } from '../../models';


export class PackagesRecognitionExtended extends PackagesRecognition {


  public static fromProject(project: Project) {
    return new PackagesRecognitionExtended(project.location);
  }

  start(force = false) {
    if (!global.tnp_normal_mode) {
      return;
    }
    Helpers.log(`Searching isomorphic packages`);
    super.start(force);
    Helpers.log(`Founded ${this.count} isomorphic packages`);
  }

  checkIsomorphic(node_modules: string, packageName: string) {
    const pjPath = fse.realpathSync(path.join(node_modules, packageName));
    let res = false;
    try {
      const proj = Project.From(pjPath);
      if (proj) {
        if (config.projectTypes.forNpmLibs.includes(proj.type)) {
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