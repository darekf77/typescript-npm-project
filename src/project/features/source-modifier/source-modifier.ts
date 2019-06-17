//#region @backend
import * as _ from 'lodash';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';

import config from '../../../config';
import { IncrementalBuildProcessExtended } from '../build-isomorphic-lib/incremental-build-process';
import { FeatureCompilerForProject, Project } from '../../abstract';
import { LibType, SourceFolder } from '../../../models';
import { TsUsage } from 'morphi/build';
import { error } from '../../../helpers';


function folderPattern(project: Project) {
  return `${
    project.isSite ? config.folder.custom : `{${[config.folder.src, config.folder.components].join(',')}}`
    }/**/*.ts`
}

export interface IsomorphicOptions {
  currentProjectName?: string;
  isWorkspaceChildProject: boolean;
  localIsomorphicLibsNames: string[];
  angularClients?: string[];
  angularLibs?: string[];
}

function getRegexIMportExport(usage: TsUsage) {
  return new RegExp(`${usage}.+from\\s+(\\'|\\").+(\\'|\\")`, 'g')
}

export class SourceModifier extends FeatureCompilerForProject {

  private static getModType(project: Project, relativePath: string): 'app' | 'lib' {
    const startFolder: SourceFolder = _.first(relativePath.replace(/^\//, '').split('/')) as SourceFolder;
    if (startFolder === 'src') {
      return project.type === 'isomorphic-lib' ? 'lib' : 'app';
    }
    if (project.type === 'angular-lib' && startFolder === 'components') {
      return 'lib';
    }
    if (project.isSite && startFolder === 'custom') {
      return this.getModType(project, relativePath.replace(`${startFolder}/`, '') as any);
    }
  }

  public static PreventNotUseOfTsSourceFolders(project: Project, relativePath: string, input: string): string {
    const saveMode = _.isUndefined(input);
    const modType = this.getModType(project, relativePath);
    if (saveMode) {
      input = fse.readFileSync(path.join(project.location, relativePath), {
        encoding: 'utf8'
      });
    }

    if (modType === 'lib') {
      (() => {
        const notallowed = [config.folder.browser, config.folder.dist, config.folder.bundle];
        project.childrenThatAreThirdPartyInNodeModules.forEach((child) => {
          const libName = child.name;
          const regexSourece = `${libName}\/(${notallowed.join('|')})`;
          input = input.replace(new RegExp(regexSourece, 'g'), libName);
        });
      })();

      (() => {
        const notallowed = [
          config.folder.browser,
          config.folder.dist,
          config.folder.module,
          config.folder.bundle
        ];

        project.childrenThatAreLibs.forEach((child) => {
          const libName = child.name;
          const sourceFolder = child.type === 'isomorphic-lib' ? config.folder.src :
            (child.type === 'angular-lib' ? config.folder.components : void 0)

          const regexSoureceForAlone = `(\\"|\\')${libName}(\\"|\\')`;
          input = input.replace(new RegExp(regexSoureceForAlone, 'g'), `${libName}/${sourceFolder}`);

          const notAllowedFor = notallowed.concat([
            IncrementalBuildProcessExtended.getBrowserVerPath(libName)
          ]);
          const regexSoureceForNotAllowed = `${libName}\/(${notAllowedFor.join('|')})`;
          input = input.replace(new RegExp(regexSoureceForNotAllowed, 'g'), `${libName}/${sourceFolder}`);
        });
      })();

      (() => {

        project.childrenThatAreClients.forEach((child) => {
          const clientName = child.name;
          const regexSourece = `(\\"|\\')${clientName}\/(${config.folder.src})`;
          const matches = input.match(new RegExp(regexSourece, 'g'));
          if (_.isArray(matches)) {
            matches.forEach(m => {
              error(`Please don't use client "${clientName}" inside source code of lib "${project.genericName}":
             files: ${relativePath}
            ...
            ${m}
            ...
             `)
            });
          }
        });
      })();


    } else if (modType === 'app') {

    }
    return input;
  }

  private options: IsomorphicOptions;

  get isomorphiOptions(): IsomorphicOptions {
    const project = this.project;
    if (project.isWorkspaceChildProject) {

      const workspace = project.parent;

      const localIsomorphicLibsNames = workspace.children
        .filter(c => (['isomorphic-lib', 'angular-lib'] as LibType[]).includes(c.type))
        .map(c => c.name);

      const angularLibs = workspace.children
        .filter(c => c.type === 'angular-lib')
        .map(c => c.name);


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

  get foldersPattern() {
    return folderPattern(this.project);
  }

  constructor(public project: Project) {
    super(folderPattern(project), '', project && project.location, project);
    console.log('SOURCEM ODIFER')
  }


  protected syncAction(): void {
    console.log("JAJJJ", this.foldersPattern)
    this.options = this.isomorphiOptions;

    const files = glob.sync(this.foldersPattern, { cwd: this.project.location });
    console.log('files;', files)
    // const files = this.project.customizableFilesAndFolders.concat(this.project.isSite ? [config.folder.custom] : [])

    // files.forEach(f => {
    //   const pathSrc = path.join(this.project.location, f);
    //   if (fse.lstatSync(pathSrc).isDirectory()) {
    //     glob.sync(`${pathSrc}/**/*.ts`).forEach(p => {
    //       this.cb({ path: p, contents: fs.readFileSync(p, { encoding: 'utf8' }) }, this.options);
    //     });
    //   }
    // });
  }

  protected preAsyncAction(): void {
    // throw new Error("Method not implemented.");
  }
  protected asyncAction(filePath: string) {
    // console.log('SOurce modifier async !',filePath)

    // if (fse.existsSync(filePath)) {
    //   this.cb({ path: filePath, contents: fs.readFileSync(filePath, { encoding: 'utf8' }) }, this.options);
    // }

  }


  private cb(file: { contents: string, path: string; }, options: IsomorphicOptions) {
    const {
      isWorkspaceChildProject,
      localIsomorphicLibsNames,
      currentProjectName,
      angularLibs
    } = options;

    if (isWorkspaceChildProject) {
      let fileContent = file.contents.toString()
      const orgFileContent = fileContent;

      localIsomorphicLibsNames.forEach(libname => {
        const regex = new RegExp(`${libname}\\/${config.folder.browser}\\/`, 'g')
        fileContent = fileContent.replace(regex, `${libname}/${IncrementalBuildProcessExtended.getBrowserVerPath(currentProjectName)}/`)
      });

      if (fileContent !== orgFileContent) {
        fs.writeFileSync(file.path, fileContent, {
          encoding: 'utf8'
        });
      }

    }
  }

}

//#endregion
