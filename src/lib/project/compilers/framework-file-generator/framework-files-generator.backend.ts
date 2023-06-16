//#region @backend
import { crossPlatformPath, fse } from 'tnp-core'
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
  const mainPath = crossPlatformPath([config.folder.src, config.folder.lib])
  if (project.isStandaloneProject) {
    folderPath = crossPlatformPath([project.location, mainPath]);
  }
  if (project.isSmartContainer) {
    folderPath = [];
    const children = project.children.filter(c => c.typeIs('isomorphic-lib'));
    for (let index = 0; index < children.length; index++) {
      const child = children[index];
      folderPath.push(crossPlatformPath([project.location, child.name, mainPath]))
    }
  }
  const options: IncCompiler.Models.BaseClientCompilerOptions = {
    folderPath,
    notifyOnFileUnlink: true,
    allowedOnlyFileExt: ['.ts'],
  };
  return options;
}

@IncCompiler.Class({ className: 'FrameworkFilesGenerator' })
export class FrameworkFilesGenerator extends FeatureCompilerForProject {

  constructor(public project: Project) {
    super(project, optionsFrameworkFileGen(project));
  }

  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change) {
    // if (event.eventName !== 'unlinkDir') {
    //   console.log(`unlink dir :${event}`)
    // } else {
    //   console.log(`action ${event.eventName} for file :`, event.fileAbsolutePath)
    // }
  }

  async syncAction(files: string[]) {
    // console.log(`sync action: absolute files pathes `, files)
  }

}


//#endregion
