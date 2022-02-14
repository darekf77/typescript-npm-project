//#region imports
//#region @backend
import { IncCompiler } from 'incremental-compiler';
//#endregion
import {
  //#region @backend
  path, crossPlatformPath
  //#endregion
} from 'tnp-core'
import { _ } from 'tnp-core';
import { Project } from './project';
import { Helpers } from 'tnp-helpers';
import { config } from 'tnp-config';
//#endregion

export abstract class FeatureCompilerForProject<RES_ASYNC = any, RES_SYNC = any, ADDITIONAL_DATA = any>
  //#region @backend
  extends IncCompiler.Base<RES_ASYNC, RES_SYNC, ADDITIONAL_DATA>
//#endregion
{

  //#region @backend
  constructor(public project: Project, options: IncCompiler.Models.BaseClientCompilerOptions,
    allowFolderOutSideProject = false) {
    super(checkFolderCompiler(project, options, allowFolderOutSideProject));
  }

  protected get notAllowedToWachFiles() {
    let notAllowedFiles = [];

    notAllowedFiles = notAllowedFiles.concat([
      config.file.controllers_ts,
      config.file.entities_ts,
    ]);

    return notAllowedFiles;
  }
  //#endregion

}

//#region helpers
//#region @backend
function checkFolderCompiler(project: Project, options: IncCompiler.Models.BaseClientCompilerOptions, dontCheck = false) {
  if (_.isUndefined(options.folderPath)) {
    options.folderPath = [];
  }
  const folders = _.isArray(options.folderPath) ? options.folderPath : [options.folderPath];
  options.folderPath = folders.map(f => {
    f = crossPlatformPath(f);
    if (!dontCheck) {
      if (f.startsWith(path.join(project.location, config.folder.node_modules))) {
        Helpers.error(`[checkFolderCompiler] Please don't watch node_module folder for ${project.location}`, false, true);
      }
      if ((!f.startsWith(project.location)) || (f.startsWith(`${project.location}/..`))) {
        Helpers.error(`[checkFolderCompiler] Please watch only folder inside project ${project.location}`, false, true);
      }
    }
    return f;
  });
  return options;
}
//#endregion
//#endregion
