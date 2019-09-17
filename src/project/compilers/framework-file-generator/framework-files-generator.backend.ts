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

export function optionsFrameworkFileGen(project: Project): IncCompiler.Models.BaseClientCompilerOptions {
  let folderPath: string | string[] = void 0;
  if (project.isWorkspaceChildProject && project.type === 'isomorphic-lib' && project.useFramework) {
    folderPath = path.join(project.location, config.folder.src);
  }
  const options: IncCompiler.Models.BaseClientCompilerOptions = {
    folderPath,
    notifyOnFileUnlink: true
  };
  return options;
}

@IncCompiler.Class({ className: 'FrameworkFilesGenerator' })
export class FrameworkFilesGenerator extends ControllersGenerator {

  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change) {
    if (!this.notAllowedToWachFiles.includes(path.basename(event.fileAbsolutePath))) {
      await this.syncAction()
    }
  }

  async syncAction() {
    if (this.project.type === 'isomorphic-lib' && this.project.useFramework) {
      this.generateEntityTs()
      this.generateControllersTs()
    } else {

    }
  }

  async start(taskName?: string, afterInitCallBack?: () => void) {
    if (this.project.isSite) {
      await this.project.baseline.frameworkFileGenerator.start(taskName, afterInitCallBack);
    }
    return super.start(taskName, afterInitCallBack);
  }

  async startAndWatch(taskName?: string, afterInitCallBack?: () => void) {
    if (this.project.isSite) {
      await this.project.baseline.frameworkFileGenerator.startAndWatch(taskName, afterInitCallBack);
    }
    return super.startAndWatch(taskName, afterInitCallBack);
  }


}


//#endregion

