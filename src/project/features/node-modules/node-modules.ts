//#region @backend
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import chalk from 'chalk';
import * as TerminalProgressBar from 'progress';

import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
import { FeatureForProject } from '../../abstract';
import { dedupePackages, nodeModulesExists } from './node-modules-helpers.backend';
import { NodeModulesBase } from './node-modules-base.backend';

export class NodeModules extends NodeModulesBase {

  get fixesForNodeModulesPackages() {
    const notAllowedNames = [
      'plugins',
      'scripts',
      'projects',
      'examples',
      'src',
      'components',
    ]

    return this.project
      .getFolders()
      .filter(f => {
        return !this.project.children.map(c => c.name).includes(path.basename(f)) &&
          !_.values(config.tempFolders).includes(path.basename(f));
      })
      .map(f => f.replace(this.project.location, '').replace(/^\//, ''))
      .filter(f => f.search('\/') === -1)
      .filter(f => !notAllowedNames.includes(f))
      ;
  }




}
//#endregion
