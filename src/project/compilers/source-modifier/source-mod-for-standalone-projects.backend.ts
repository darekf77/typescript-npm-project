import * as path from 'path';
import * as _ from 'lodash';
import * as fse from 'fs-extra';

import { Project } from '../../abstract';
import { config } from '../../../config';
import { ModType, SourceCodeType, CheckType } from './source-modifier.models';
import { IncCompiler } from 'incremental-compiler';
import { Models, Helpers } from '../../../index';
import { impReplace } from './source-modifier.helpers.backend';

function optionsSourceModifier(project: Project): IncCompiler.Models.BaseClientCompilerOptions {
  let folderPath: string | string[] = void 0;
  if (project.isWorkspaceChildProject) {
    if (project.isSite) {
      if (project.type === 'angular-lib') {
        folderPath = [
          folderPath = path.join(project.location, config.folder.src),
          folderPath = path.join(project.location, config.folder.components),
          folderPath = path.join(project.baseline.location, config.folder.src),
          folderPath = path.join(project.baseline.location, config.folder.components),
        ]
      } else {
        folderPath = path.join(project.location, config.folder.src),
          folderPath = path.join(project.baseline.location, config.folder.src)
      }
    } else {
      if (project.type === 'angular-lib') {
        folderPath = [
          folderPath = path.join(project.location, config.folder.src),
          folderPath = path.join(project.location, config.folder.components),
        ]
      } else {
        folderPath = path.join(project.location, config.folder.src);
      }
    }
  } else if (project.isStandaloneProject) {
    if (project.type === 'angular-lib') {
      folderPath = [
        folderPath = path.join(project.location, config.folder.src),
        folderPath = path.join(project.location, config.folder.components),
      ]
    } else {
      folderPath = path.join(project.location, config.folder.src);
    }
  }
  const options: IncCompiler.Models.BaseClientCompilerOptions = {
    folderPath
  };
  return options;
}


export class SourceModForStandaloneProjects
  extends IncCompiler.Base<Models.morphi.ModifiedFiles, Models.morphi.ModifiedFiles> {

  constructor(public project: Project) {
    super(optionsSourceModifier(project));
  }

  protected get foldersSources() {
    return [
      config.folder.components,
      config.folder.src,
    ];
  };

  protected get foldersCompiledJsDtsMap() {
    return [
      config.folder.dist,
      config.folder.bundle,
      config.folder.browser,
      config.folder.module,
    ];
  };


  protected process(input: string, relativePath: string): string {
    const modType = this.getModType(this.project, relativePath);
    input = this.mod3rdPartyLibsReferces(input, modType, relativePath);
    return input;
  }

  public processFile(relativePath: string, files: Models.morphi.ModifiedFiles): boolean {
    const absoluteFilePath = path.join(this.project.location, relativePath);

    if (!fse.existsSync(absoluteFilePath) ||
      this.project.sourceFilesToIgnore().includes(relativePath) ||
      !config.extensions.modificableByReplaceFn.includes(path.extname(relativePath))
    ) {
      return false;
    }
    const input = Helpers.readFile(absoluteFilePath);
    const modified = this.process(input, relativePath);
    if (input !== modified) {
      Helpers.writeFile(absoluteFilePath, modified);
      files.modifiedFiles.push(absoluteFilePath);
      return true;
    }
    return false;
  }


  //#region get source type lib - for libs, app - for clients
  protected getModType(project: Project, relativePath: string): ModType {
    const startFolder: Models.other.SourceFolder = _.first(relativePath.replace(/^\//, '')
      .split('/')) as Models.other.SourceFolder;
    if (/^tmp\-src(?!\-)/.test(startFolder)) {
      return 'tmp-src';
    }
    if (startFolder === 'src') {
      return project.type === 'isomorphic-lib' ? 'lib' : 'app';
    }
    if (project.type === 'angular-lib' && startFolder === 'components') {
      return 'lib';
    }
    if (project.isSite && startFolder === 'custom') {
      return `custom/${this.getModType(project, relativePath.replace(`${startFolder}/`, '') as any)}` as any;
    }
  }
  //#endregion


  protected mod3rdPartyLibsReferces(
    input: string,
    modType: ModType,
    relativePath: string): string {

    const method: CheckType = 'standalone';
    const folders = [
      ...this.foldersSources,
      ...this.foldersCompiledJsDtsMap,
    ];

    const children = this.project.parent.childrenThatAreThirdPartyInNodeModules;

    children.forEach(child => {
      const libName = child.name;

      if (modType === 'lib' || modType === 'custom/lib' || modType === 'app' || modType === 'custom/app') {
        input = impReplace({
          name: `${libName}/${folders.join('|\n')} -> ${libName}`,
          project: this.project,
          input,
          modType,
          urlParts: [libName, folders],
          partsReplacements: [libName],
          relativePath,
          method
        });
      }

      if (modType === 'tmp-src' && this.project.type !== 'isomorphic-lib') {
        input = impReplace({
          name: `${libName} -> ${libName}/${config.folder.browser}`,
          project: this.project,
          input,
          modType,
          urlParts: [libName],
          notAllowedAfterSlash: [config.folder.browser],
          partsReplacements: [libName, config.folder.browser],
          relativePath,
          method
        });

        input = impReplace({
          name: `${libName}/(${folders.join('|\n')}) -> ${libName}/${config.folder.browser}`,
          project: this.project,
          input,
          modType,
          urlParts: [libName, folders],
          partsReplacements: [libName, config.folder.browser],
          relativePath,
          method
        });
      }

    });

    return input;
  }

}
