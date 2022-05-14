//#region @backend
import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import * as JSON5 from 'json5';
import { glob } from 'tnp-core';

import { Project } from '../../abstract';
import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { FeatureCompilerForProject } from '../../abstract';
import { IncCompiler } from 'incremental-compiler';
import { ControllersGenerator } from './controllers-generator.backend';

export function optionsFrameworkFileGen(project: Project): IncCompiler.Models.BaseClientCompilerOptions {
  let folderPath: string | string[] = void 0;
  if (project.isWorkspaceChildProject && project.isGeneratingControllerEntities) {
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
    if (event.eventName !== 'unlinkDir') {
      if (!this.notAllowedToWachFiles.includes(path.basename(event.fileAbsolutePath))) {
        await this.syncAction()
      }
    }
  }

  async syncAction() {
    if (this.project.isGeneratingControllerEntities) {
      const isSiteInStrictMode = this.project.isSiteInStrictMode;
      let cwd = path.join(this.project.location, config.folder.src);
      this.generateEntityTs(cwd);
      this.generateControllersTs(cwd);
      if (isSiteInStrictMode) {
        cwd = path.join(this.project.location, config.folder.custom, config.folder.src);
        this.generateEntityTs(cwd, true);
        this.generateControllersTs(cwd, true);
      }
    } else {

    }
  }

  async start(taskName?: string, afterInitCallBack?: () => void) {
    if (this.project.isSiteInStrictMode) {
      await this.project.baseline.frameworkFileGenerator.start(taskName);
    }
    return super.start(taskName, afterInitCallBack);
  }

  async startAndWatch(taskName?: string, options?: IncCompiler.Models.StartAndWatchOptions) {
    const { watchOnly } = options || {};
    if (this.project.isSiteInStrictMode) {
      await this.project.baseline.frameworkFileGenerator.startAndWatch(taskName, { watchOnly });
    }
    return super.startAndWatch(taskName, options);
  }


}


//#endregion
