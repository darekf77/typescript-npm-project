//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import chalk from 'chalk';
import * as TerminalProgressBar from 'progress';

import { Project } from '../../abstract';
import { Models } from '../../../models';
import { Helpers } from '../../../helpers';
import { config } from '../../../config';
import { FeatureForProject } from '../../abstract';
import { dedupePackages, nodeModulesExists } from './node-modules-helpers.backend';
import { NodeModulesBase } from './node-modules-base.backend';

export class NodeModules extends NodeModulesBase {

  get fixesForNodeModulesPackages() {
    return this.project
      .getFolders()
      .filter(f => {
        return !this.project.children.map(c => c.name).includes(path.basename(f)) &&
          !_.values(config.tempFolders).includes(path.basename(f));
      })
      .map(f => f.replace(this.project.location, '').replace(/^\//, ''))
      ;
  }

}
//#endregion
