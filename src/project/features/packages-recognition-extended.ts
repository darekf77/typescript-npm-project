//#region @backend
import { PackagesRecognition } from 'morphi/build/packages-recognition';
import { Project } from '../abstract';
import { log } from '../../helpers';

export class PackagesRecognitionExtended extends PackagesRecognition {


  public static fromProject(project: Project) {
    return this.From(project.location);
  }

  start(force = false) {
    log(`Searching isomorphic packages`);
    super.start(force);
    log(`Founded ${this.count} isorphic packages`);
  }

}



//#endregion
