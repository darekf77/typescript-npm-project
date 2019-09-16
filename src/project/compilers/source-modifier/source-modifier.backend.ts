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
import { SourceModForWorkspaceChilds } from './source-mod-for-worspace-childs.backend';
import { IncCompiler } from 'incremental-compiler';
//#endregion

export function optionsSourceModifier(project: Project): IncCompiler.Models.BaseClientCompilerOptions {
  // console.log('PROJECT', project.name)
  let folderPath: string | string[] = void 0;
  if (project.isWorkspaceChildProject || project.isStandaloneProject) {
    folderPath = [
      folderPath = path.join(project.location, config.folder.src),
    ]
    if (project.type === 'angular-lib') {
      folderPath.push(path.join(project.location, config.folder.components));
    }
    if (project.isSite) {
      folderPath.push(path.join(project.location, config.folder.custom));
    }
  }
  const options: IncCompiler.Models.BaseClientCompilerOptions = {
    folderPath,

  };
  // if (project.isStandaloneProject) {
  //   console.log(`${project.genericName}: optionsSourceModifier`, options)
  // }
  // if (project.name === 'simple-lib') {
  //   console.log('optionsSourceModifier', options)
  // }
  return options;
}


@IncCompiler.Class({ className: 'SourceModifier' })
export class SourceModifier extends SourceModForWorkspaceChilds {

  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change): Promise<Models.other.ModifiedFiles> {
    // @LAST fix watching to much files
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
    // console.log(modifiedFiles)
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

  process(input: string, relativePath: string) {
    const modType = this.getModType(this.project, relativePath);
    // console.log(`modType: ${modType}, relatiePath: ${relativePath}`)
    input = Helpers.tsCodeModifier.fixApostrphes(input);
    // input = Helpers.tsCodeModifier.fixRegexes(input);
    input = super.process(input, relativePath);
    if (this.project.isWorkspaceChildProject) {
      input = this.modWorkspaceChildrenLibsBetweenItself(input, modType, relativePath);
      input = this.modSiteChildrenLibsInClient(input, modType, relativePath);
    }
    return input;
  }

  async start(taskName?: string, afterInitCallBack?: () => void) {
    if (this.project.isSite) {
      await this.project.baseline.sourceModifier.start(taskName, afterInitCallBack);
    }
    return super.start(taskName, afterInitCallBack);
  }

  async startAndWatch(taskName?: string, afterInitCallBack?: () => void) {
    Helpers.log(`Start source modifer for ${this.project.genericName}`)
    if (this.project.isSite) {
      await this.project.baseline.sourceModifier.startAndWatch(taskName, afterInitCallBack);
    }
    return super.startAndWatch(taskName, afterInitCallBack);
  }

}
