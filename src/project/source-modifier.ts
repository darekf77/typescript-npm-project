//#region @backend
import * as fs from 'fs';

import { Project } from './base-project';
import { FilesRecreator } from './files-builder';
import config from '../config';
import { ProjectFrom } from './index';

export interface IsomorphicOptions {
  currentProjectName?: string;
  isWorkspaceChildProject: boolean;
  localIsomorphicLibsNames: string[];
}


export class SourceModifier {


  constructor(private project: Project, filesRecreator: FilesRecreator) {

  }

  run() {

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
        fileContent = fileContent.replace(regex, `${libname}/tmp-for-${currentProjectName}-${config.folder.browser}/`)
      })                // import { ... } from 'ss-common-logic/tmp-for-ss-common-ui-module'

      // console.log('write file here ', file.path)
      fs.writeFileSync(file.path, fileContent, {
        encoding: 'utf8'
      });
    }
  }

}

//#endregion
