//#region @backend
import * as path from 'path';
import * as fse from 'fs-extra';
import { PackagesRecognition } from 'morphi/build/packages-recognition';
import { Project } from '../abstract';
import { log } from '../../helpers';
import config from '../../config';
import { IPackageJSON } from '../../models';


export class PackagesRecognitionExtended extends PackagesRecognition {


  public static fromProject(project: Project) {
    return new PackagesRecognitionExtended(project.location);
  }

  start(force = false) {
    if (!global.tnp_normal_mode) {
      return;
    }
    log(`Searching isomorphic packages`);
    super.start(force);
    log(`Founded ${this.count} isomorphic packages`);
  }

  checkIsomorphic(node_modules: string, packageName: string) {
    const pjPath = fse.realpathSync(path.join(node_modules, packageName));
    let res = false;
    try {
      const proj = Project.From(pjPath);
      if (proj) {
        if (proj.type === 'isomorphic-lib' || proj.type === 'angular-lib') {
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
