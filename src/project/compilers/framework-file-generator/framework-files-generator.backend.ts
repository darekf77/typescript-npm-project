//#region @backend
import * as fse from 'fs-extra';
import * as path from 'path';
import * as JSON5 from 'json5';
import * as glob from 'glob';
import * as rimraf from 'rimraf';

import { Project } from '../../abstract';
import { config } from '../../../config';
import { Helpers } from '../../../helpers';
import { FeatureCompilerForProject } from '../../abstract';
import { IncCompiler } from 'incremental-compiler';
import { ControllersGenerator } from './controllers-generator.backend';

@IncCompiler.Class({ className: 'FrameworkFilesGenerator' })
export class FrameworkFilesGenerator extends ControllersGenerator {

  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change) {
    this.syncAction()
  }

  async syncAction() {
    if (this.project.type === 'isomorphic-lib' && this.project.useFramework) {
      this.generateEntityTs()
      this.generateControllersTs()
    }
  }


}


//#endregion

