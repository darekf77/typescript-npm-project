//#region imports
import * as _ from 'lodash';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';

import { config } from '../../../config';
import { FeatureCompilerForProject, Project } from '../../abstract';
import { Models } from '../../../models';
import { Helpers } from '../../../helpers';
import { ModType, SourceCodeType } from './source-modifier.models';
import { SourceModForWorkspaceChilds } from './source-mod-for-worspace-childs.backend';
import { IncCompiler } from 'incremental-compiler';
//#endregion

@IncCompiler.Class({ className: 'SourceModifier' })
export class SourceModifier extends SourceModForWorkspaceChilds {

  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change): Promise<Models.other.ModifiedFiles> {
    const relativePathToProject = event.fileAbsolutePath
      .replace(this.project.location, '')
      .replace(/^\//, '');
    const modifiedFiles: Models.other.ModifiedFiles = { modifiedFiles: [] };

    Helpers.log(`Source modifer async action for ${relativePathToProject}`)

    this.processFile(relativePathToProject, modifiedFiles);

    if (fse.existsSync(event.fileAbsolutePath)) {
      const relativePath = relativePathToProject.replace(/^src/, config.folder.tempSrc)
      const newPath = path.join(this.project.location, relativePath);
      if (Helpers.copyFile(relativePathToProject, newPath, { modifiedFiles, fast: true })) {
        this.processFile(relativePath, modifiedFiles);
      }
    }
    console.log(modifiedFiles)
    return modifiedFiles;
  }

  async syncAction(absoluteFilePathes: string[]): Promise<Models.other.ModifiedFiles> {
    const modifiedFiles: Models.other.ModifiedFiles = { modifiedFiles: [] };

    const relativePathesToProject = absoluteFilePathes.map(absoluteFilePath => {
      return absoluteFilePath
        .replace(this.project.location, '')
        .replace(/^\//, '');
    });

    relativePathesToProject.forEach(relativePathToProject => {
      this.processFile(relativePathToProject, modifiedFiles);
    });

    Helpers.tryRemoveDir(path.join(this.project.location, config.folder.tempSrc));

    relativePathesToProject.forEach(relativePathToProject => {
      const orgAbsolutePath = path.join(this.project.location, relativePathToProject);
      const relativePathToTempSrc = relativePathToProject.replace(/^src/, config.folder.tempSrc);
      const destinationPath = path.join(this.project.location, relativePathToTempSrc);
      if (Helpers.copyFile(orgAbsolutePath, destinationPath, { modifiedFiles })) {
        if (fse.existsSync(destinationPath)) {
          this.processFile(relativePathToTempSrc, modifiedFiles);
        }
      }
    });
    return modifiedFiles;
  }

}
