//#region imports
import * as path from 'path';
import * as _ from 'lodash';
import { Project } from './project';
import { Helpers } from 'tnp-helpers';
import { IncCompiler } from 'incremental-compiler';
import { config } from '../../config';
import { CLASS } from 'typescript-class-helpers';
import { FrameworkFilesGenerator } from '../compilers/index';
//#endregion

export abstract class FeatureCompilerForProject<RES_ASYNC = any, RES_SYNC = any, ADDITIONAL_DATA = any>
  extends IncCompiler.Base<RES_ASYNC, RES_SYNC, ADDITIONAL_DATA> {

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

}

function checkFolderCompiler(project: Project, options: IncCompiler.Models.BaseClientCompilerOptions, dontCheck = false) {
  if (_.isUndefined(options.folderPath)) {
    options.folderPath = [];
  }
  const folders = _.isArray(options.folderPath) ? options.folderPath : [options.folderPath];
  options.folderPath = folders.map(f => {
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
