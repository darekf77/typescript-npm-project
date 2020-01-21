import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';

import { config } from '../../config';
import { Helpers } from 'tnp-helpers';
import { Project } from '../abstract';
import { Models } from 'tnp-models';
import { FeatureForProject } from '../abstract';



export class SingularWorkspaceBuilder extends FeatureForProject {

  distLocation() {
    // return path.join(this.project.location, config.folder.dist);
  }

  run() {
    Helpers.mkdirp(path.join(this.project.location, 'bundle'))

    this.project.children.forEach



  }

}
