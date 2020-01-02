import * as fse from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';

import { Project } from './project';
import { Helpers } from '../../../helpers';
import { Morphi } from 'morphi';
import { Models } from 'tnp-models';
import { config } from '../../../config';

export abstract class RecreatableProject {

  /**
   * Core project with basic tested functionality
   */
  get isCoreProject(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isCoreProject;
    }
    //#region @backend
    if (this.isWorkspaceChildProject || (this.isContainerChild && this.isWorkspace)) {
      if (this.parent.packageJson.isCoreProject != this.packageJson.isCoreProject) {
        this.packageJson.data.tnp.isCoreProject = void 0;
        this.packageJson.writeToDisc();
      }
    }
    return this.packageJson && this.packageJson.isCoreProject;
    //#endregion
  }


  //#region @backend
  /**
   * Generated automaticly file templates exmpale:
   * file.ts.filetemplate -> will generate file.ts
   * inside triple bracked: {{{  ENV. }}}
   * property ENV can be used to check files
   */
  public filesTemplates(this: Project): string[] {
    // should be abstract
    return []
  }
  //#endregion

  //#region @backend
  public projectSourceFiles(this: Project): string[] {
    if (this.type === 'unknow') {
      return [];
    }
    // should be abstract
    return [
      ...this.filesTemplates(),
      ...(this.filesTemplates().map(f => f.replace(`.${config.filesExtensions.filetemplate}`, ''))),
      ...(this.projectSpecyficFiles())
    ];
  }
  //#endregion

  //#region @backend
  public projectSpecyficIgnoredFiles(this: Project) {
    return [];
  }
  //#endregion


  //#region @backend
  sourceFilesToIgnore(this: Project) {
    return [];
  }
  //#endregion

  get customizableFilesAndFolders(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.customizableFilesAndFolders;
    }
    //#region @backend
    if (this.type === 'unknow') {
      return [];
    }
    const extraFolders = this.getFolders()
      .filter(f => !this.children.map(c => c.name).includes(path.basename(f)))
      .filter(f => !['src', 'backup'].includes(path.basename(f)))
      .map(f => path.basename(f))

    if (this.type === 'workspace') return [
      // 'environment.d.ts',
      'environment.js',
      'environment.dev.js',
      'environment.prod.js',
      'environment.test.js',
      'environment.stage.js',
      'environment.static.js',
      'environment.online.js'
    ].concat(!this.isSite ? extraFolders : [])
    const files: string[] = ['src']
    if (this.type === 'angular-lib') files.push('components');

    return files;
    //#endregion
  }


}

// export interface RecreatableProject extends Partial<Project> { }
