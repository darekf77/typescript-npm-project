//#region @backend
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';

import { Project } from '../project/base-project';
import { FilesRecreator } from '../project/files-builder';
import config from '../config';
import { ProjectFrom } from '../project/index';
import { IncrementalBuildProcessExtended } from '../build-isomorphic-lib/incremental-build-process';
import { IncrementalCompilation } from 'morphi/build';
import { IsomorphicOptions } from '../project/source-modifier';
import { Helpers } from 'morphi';
import { tryRemoveDir } from '../helpers';



export class AnglarLibModuleDivider extends IncrementalCompilation {

  public static nameFor(clientName: string) {
    return `${config.folder.module}-for-${clientName}`;
  }
  private options: IsomorphicOptions;
  protected syncAction(): void {
    this.options = this.isomorphiOptions;

    this.options.angularClients.forEach(angularClientName => {
      const divideModulePath = path.join(this.project.location, AnglarLibModuleDivider.nameFor(angularClientName))
      if (fse.existsSync(divideModulePath)) {
        tryRemoveDir(divideModulePath)
      }
      fse.mkdirSync(divideModulePath);
    })

    this.filesAndFoldesRelativePathes = glob.sync(this.globPattern, { cwd: this.project.location })
    // console.log('this.globPattern', this.globPattern)
    // console.log('this.filesAndFoldesRelativePathes', this.filesAndFoldesRelativePathes)

    const files = this.filesAndFoldesRelativePathes; // .map(f => f.replace(new RegExp(`^${config.folder.dist}\/`), ''))

    files.forEach(f => {
      const p = path.join(this.project.location, f)
      this.cb({ path: p, contents: fs.readFileSync(p, { encoding: 'utf8' }) }, this.options);
    })
  }

  protected preAsyncAction(): void {
    // throw new Error("Method not implemented.");
  }
  protected asyncAction(filePath: string) {
    // console.log('async action file: ', filePath)
    this.cb({ path: filePath, contents: fs.readFileSync(filePath, { encoding: 'utf8' }) }, this.options);
  }


  constructor(private project: Project) {
    super(`${config.folder.dist}/**/*.js`, '', project.location);

  }


  get isomorphiOptions(): IsomorphicOptions {
    const project = this.project;
    if (project.isWorkspaceChildProject) {

      const workspace = project.parent;
      const localIsomorphicLibsNames = workspace.children
        .filter(c => c.type === 'isomorphic-lib')
        .map(c => c.name)

      const angularClients = workspace.children
        .filter(c => config.allowedTypes.app.includes(c.type))
        .filter(c => c.name !== this.project.name)
        .map(c => c.name)

      return {
        currentProjectName: project.name,
        isWorkspaceChildProject: true,
        localIsomorphicLibsNames,
        angularClients
      }

    }
    return {
      isWorkspaceChildProject: false,
      localIsomorphicLibsNames: [],
      angularClients: []
    }
  }



  cb(file: { contents: string, path: string; }, options: IsomorphicOptions) {
    const { isWorkspaceChildProject,
      localIsomorphicLibsNames,
      currentProjectName,
      angularClients
    } = options;

    if (isWorkspaceChildProject) {


      angularClients.forEach(angularClientName => {
        const newDestPath = file.path.replace(new RegExp(`\/${config.folder.dist}\/`),
          `/${AnglarLibModuleDivider.nameFor(angularClientName)}/`)

        let fileContent = file.contents;

        localIsomorphicLibsNames.forEach(isomorphicLibName => {
          fileContent = file.contents.replace(
            new RegExp(`${isomorphicLibName}\/${IncrementalBuildProcessExtended.getBrowserVerPath(this.project.name)}`, 'g'),
            `${isomorphicLibName}/${IncrementalBuildProcessExtended.getBrowserVerPath(angularClientName)}`
          )
        })

        if (!fse.existsSync(path.dirname(newDestPath))) {
          fse.mkdirpSync(path.dirname(newDestPath))
        }

        fs.writeFileSync(newDestPath, fileContent, {
          encoding: 'utf8'
        });

        fse.copyFileSync(file.path.replace(/\.js$/, '.js.map'), newDestPath.replace(/\.js$/, '.js.map'))
        fse.copyFileSync(file.path.replace(/\.js$/, '.d.ts'), newDestPath.replace(/\.js$/, '.d.ts'))
      })

    }
  }

}

//#endregion
