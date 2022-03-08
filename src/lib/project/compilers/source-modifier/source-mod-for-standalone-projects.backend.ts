import { path } from 'tnp-core'
import { _ } from 'tnp-core';
import { fse } from 'tnp-core'

import { Project, FeatureCompilerForProject } from '../../abstract';
import { config } from 'tnp-config';
import { ModType, CheckType } from './source-modifier.models';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { impReplace } from './source-modifier.helpers.backend';
import { optionsSourceModifier } from './source-modifier.backend';

export class SourceModForStandaloneProjects
  extends FeatureCompilerForProject<Models.other.ModifiedFiles, Models.other.ModifiedFiles> {

  constructor(public project: Project) {
    super(project, optionsSourceModifier(project));
  }

  protected get foldersSources() {
    //#region folder with code visible to users
    return [
      config.folder.components,
      config.folder.src,
    ];
    //#endregion
  };

  protected get foldersCompiledJsDtsMap() {
    //#region folder with code invisible to user... compiler in backgroud
    return [
      config.folder.dist,
      config.folder.bundle,
      config.folder.browser,
      config.folder.client,
      config.folder.module,
    ];
    //#endregion
  };

  protected process(input: string, relativePath: string): string {
    const modType = this.getModType(this.project, relativePath);
    input = this.mod3rdPartyLibsReferces(input, modType, relativePath);
    return input;
  }

  public processFile(relativePath: string, files: Models.other.ModifiedFiles, source?: 'tmp-src-for'): boolean {
    //#region process file
    const absoluteFilePath = path.join(this.project.location, relativePath);

    if (!fse.existsSync(absoluteFilePath)) {
      return false;
    }

    if (source === 'tmp-src-for') {
      if (path.extname(relativePath) !== '.ts') {
        return false;
      }

    } else {
      if (this.project.sourceFilesToIgnore().includes(relativePath) ||
        !config.extensions.modificableByReplaceFn.includes(path.extname(relativePath))
      ) {
        return false;
      }
    }

    const input = Helpers.readFile(absoluteFilePath);
    const modified = this.process(input, relativePath);

    if (input !== modified) {
      Helpers.writeFile(absoluteFilePath, modified);
      files.modifiedFiles.push(absoluteFilePath);
      return true;
    }
    //#endregion
    return false;
  }

  //#region get source type lib - for libs, app - for clients
  protected getModType(project: Project, relativePath: string): ModType {
    const startFolder: Models.other.SourceFolder = _.first(relativePath.replace(/^\//, '')
      .split('/')) as Models.other.SourceFolder;
    if (/^tmp\-src(?!\-)/.test(startFolder)) {
      return 'tmp-src';
    }
    if (/^tmp\-src\-/.test(startFolder)) {
      return 'tmp-src-for';
    }
    if (startFolder === 'src') {
      return project.typeIs('isomorphic-lib') ? 'lib' : 'app';
    }
    if (project.typeIs('angular-lib') && startFolder === 'components') {
      return 'lib';
    }
    if (project.isSiteInStrictMode && startFolder === config.folder.custom) {
      return `${config.folder.custom}/${this.getModType(project, relativePath.replace(`${startFolder}/`, '') as any)}` as any;
    }
  }
  //#endregion


  //#region handle isomorphi-lib and angular-lib in node_modules
  protected mod3rdPartyLibsReferces(
    input: string,
    modType: ModType,
    relativePath: string): string {

    const method: CheckType = 'standalone';
    const folders = [
      ...this.foldersSources,
      ...this.foldersCompiledJsDtsMap,
    ];

    const children = this.project.isWorkspaceChildProject ?
      this.project.parent.childrenThatAreThirdPartyInNodeModules
      : this.project.childrenThatAreThirdPartyInNodeModules;

    children.forEach(child => {
      const libName = child.name;

      input = impReplace({
        name: `'${libName}*whatever*' -> ${libName} strict solution for standalone libs`,
        project: this.project,
        input,
        modType,
        urlParts: new RegExp(`${Helpers.escapeStringForRegEx(libName)}${config.regexString.pathPartStringRegex}`),
        partsReplacements: [libName],
        relativePath,
        partsReplacementsOptions: { replaceWhole: true },
        method
      });

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

      if (modType === 'tmp-src-for') {
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

      if (modType === 'tmp-src' && this.project.typeIsNot('isomorphic-lib')) {
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
  //#endregion

}
