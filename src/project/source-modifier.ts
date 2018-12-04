//#region @backend
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';

import { Project } from './base-project';
import { FilesRecreator } from './files-builder';
import config from '../config';
import { ProjectFrom } from './index';
import { IncrementalBuildProcessExtended } from '../build-isomorphic-lib/incremental-build-process';
import { IncrementalCompilation } from 'morphi/build';

export interface IsomorphicOptions {
  currentProjectName?: string;
  isWorkspaceChildProject: boolean;
  localIsomorphicLibsNames: string[];
  angularClients?: string[];
}


export class SourceModifier extends IncrementalCompilation {

  private options: IsomorphicOptions;
  protected syncAction(): void {
    this.options = this.isomorphiOptions;

    const files = this.project.customizableFilesAndFolders.concat(this.project.isSite ? [config.folder.custom] : [])

    files.forEach(f => {
      const pathSrc = path.join(this.project.location, f);
      if (fse.lstatSync(pathSrc).isDirectory()) {
        glob.sync(`${pathSrc}/**/*.ts`).forEach(p => {
          this.cb({ path: p, contents: fs.readFileSync(p, { encoding: 'utf8' }) }, this.options);
        })
      }
    })
  }

  protected preAsyncAction(): void {
    // throw new Error("Method not implemented.");
  }
  protected asyncAction(filePath: string) {
    this.cb({ path: filePath, contents: fs.readFileSync(filePath, { encoding: 'utf8' }) }, this.options);
  }


  constructor(private project: Project, filesRecreator: FilesRecreator) {
    super(`(src|components)/**/*.ts`, '', project.location);

  }


  get isomorphiOptions(): IsomorphicOptions {
    const project = this.project;
    if (project.isWorkspaceChildProject) {

      const workspace = project.parent;
      const localIsomorphicLibsNames = workspace.children
        .filter(c => c.type === 'isomorphic-lib')
        .map(c => c.name)
      return {
        currentProjectName: project.name,
        isWorkspaceChildProject: true,
        localIsomorphicLibsNames
      }

    }
    return {
      isWorkspaceChildProject: false,
      localIsomorphicLibsNames: []
    }
  }



  cb(file: { contents: string, path: string; }, options: IsomorphicOptions) {
    const { isWorkspaceChildProject, localIsomorphicLibsNames, currentProjectName } = options;

    if (isWorkspaceChildProject) {
      let fileContent = file.contents.toString()
      localIsomorphicLibsNames.forEach(libname => {
        const regex = new RegExp(`${libname}\\/${config.folder.browser}\\/`, 'g')
        // console.log('regex source', regex.source)
        // console.log('replace Here ', fileContent)
        fileContent = fileContent.replace(regex, `${libname}/${IncrementalBuildProcessExtended.getBrowserVerPath(currentProjectName)}/`)
      })                // import { ... } from 'ss-common-logic/tmp-for-ss-common-ui-module'

      // console.log('write file here ', file.path)
      fs.writeFileSync(file.path, fileContent, {
        encoding: 'utf8'
      });
    }
  }

}

//#endregion
