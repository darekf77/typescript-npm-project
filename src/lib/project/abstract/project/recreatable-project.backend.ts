import { fse } from 'tnp-core'
import { path } from 'tnp-core'
import { _ } from 'tnp-core';
import chalk from 'chalk';

import type { Project } from './project';
import { Helpers } from 'tnp-helpers';

import { Models } from 'tnp-models';
import { config } from 'tnp-config';

export abstract class RecreatableProject {

  /**
   * Core project with basic tested functionality
   */
  // @ts-ignore
  get isCoreProject(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.isCoreProject;
    }
    //#region @backend
    // TODO UNCOMMENT PROBASBLY ?
    // if (this.isWorkspaceChildProject || (this.isContainerChild && this.isWorkspace)) {
    //   if (this.parent.packageJson.isCoreProject != this.packageJson.isCoreProject) {
    //     this.packageJson.data.tnp.isCoreProject = void 0; // TODO why is that
    //     // this.packageJson.writeToDisc();
    //   }
    // }
    // if (this.isVscodeExtension && this.parent?.packageJson.isCoreProject) {
    //   if (this.parent.packageJson.isCoreProject != this.packageJson.isCoreProject) {
    //     this.packageJson.data.tnp.isCoreProject = true;
    //     // this.packageJson.writeToDisc();
    //   }
    // }
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
    if (this.typeIs('unknow')) {
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

  //#region @backend
  async initProcedure(this: Project) {
    return void 0;
  }

  public async __initProcedure(this: Project) {
    Helpers.log(`Started init procedure of project (${this._type}) "${this.genericName}...`);
    await this.initProcedure();
    Helpers.log(`End init procedure of project (${this._type}) "${this.genericName}" started...`);
  }
  //#endregion

  // @ts-ignore
  get customizableFilesAndFolders(this: Project) {
    if (Helpers.isBrowser) {
      return this.browser.customizableFilesAndFolders;
    }
    //#region @backend
    if (this.typeIs('unknow')) {
      return [];
    }

    const files: string[] = ['src'];
    return files;
    //#endregion
  }


}

// export interface RecreatableProject extends Partial<Project> { }
