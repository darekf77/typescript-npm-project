//#region @backend
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';

import { Project } from '../project';
import { FilesRecreator } from './files-builder';
import config from '../../config';
import { IncrementalBuildProcessExtended } from './build-isomorphic-lib/incremental-build-process';
import { IncrementalCompilation } from 'morphi/build';
import { AnglarLibModuleDivider } from './build-isomorphic-lib/angular-lib-module-build';

export interface IsomorphicOptions {
  currentProjectName?: string;
  isWorkspaceChildProject: boolean;
  localIsomorphicLibsNames: string[];
  angularClients?: string[];
  angularLibs?: string[];
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
    // console.log('SOurce modifier async !',filePath)
    this.cb({ path: filePath, contents: fs.readFileSync(filePath, { encoding: 'utf8' }) }, this.options);
  }


  constructor(private project: Project) {
    super(`(src|components)/**/*.ts`, '', project && project.location);

  }


  get isomorphiOptions(): IsomorphicOptions {
    const project = this.project;
    if (project.isWorkspaceChildProject) {

      const workspace = project.parent;

      const localIsomorphicLibsNames = workspace.children
        .filter(c => c.type === 'isomorphic-lib')
        .map(c => c.name)

      const angularLibs = workspace.children
        .filter(c => c.type === 'angular-lib')
        .map(c => c.name)


      return {
        currentProjectName: project.name,
        isWorkspaceChildProject: true,
        localIsomorphicLibsNames,
        angularLibs
      }

    }
    return {
      isWorkspaceChildProject: false,
      localIsomorphicLibsNames: [],
      angularLibs: []
    }
  }


  private replaceWhenWholeModule(angularLibName: string, fileContent: string) {
    const tofind = `(\'|\")${angularLibName}/${config.folder.module}(\'|\")`
    const regex = new RegExp(tofind, 'g')
    const replacement = `'${angularLibName}/${AnglarLibModuleDivider.nameFor(this.project.name)}'`;
    return fileContent.replace(regex, replacement)
  }

  private replaceWhenReferingInsideModule(angularLibName: string, fileContent: string) {
    const tofind = `${angularLibName}/${config.folder.module}/`
    const regex = new RegExp(tofind, 'g')
    const replacement = `${angularLibName}/${AnglarLibModuleDivider.nameFor(this.project.name)}/`;
    return fileContent.replace(regex, replacement)
  }

  cb(file: { contents: string, path: string; }, options: IsomorphicOptions) {
    const {
      isWorkspaceChildProject,
      localIsomorphicLibsNames,
      currentProjectName,
      angularLibs
    } = options;

    if (isWorkspaceChildProject) {
      let fileContent = file.contents.toString()
      let orgFileContent = fileContent;

      localIsomorphicLibsNames.forEach(libname => {
        const regex = new RegExp(`${libname}\\/${config.folder.browser}\\/`, 'g')
        fileContent = fileContent.replace(regex, `${libname}/${IncrementalBuildProcessExtended.getBrowserVerPath(currentProjectName)}/`)
      })


      angularLibs.forEach(angularLibName => {
        // TODO same should be for isomorphic lib ?
        fileContent = this.replaceWhenWholeModule(angularLibName, fileContent)
        fileContent = this.replaceWhenReferingInsideModule(angularLibName, fileContent)
      })

      if (fileContent !== orgFileContent) {
        fs.writeFileSync(file.path, fileContent, {
          encoding: 'utf8'
        });
      }

    }
  }

}

//#endregion
