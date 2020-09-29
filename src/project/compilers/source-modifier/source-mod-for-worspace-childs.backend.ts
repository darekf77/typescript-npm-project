import * as _ from 'lodash';
import * as path from 'path';
import { SourceModForStandaloneProjects } from './source-mod-for-standalone-projects.backend';
import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { ModType, CheckType } from './source-modifier.models';

import { impReplace } from './source-modifier.helpers.backend';

export class SourceModForWorkspaceChilds extends SourceModForStandaloneProjects {


  protected modWorkspaceChildrenLibsBetweenItself(
    input: string, modType: ModType, relativePath: string): string {
    const method: CheckType = 'baseline';
    const childrenLibs = this.project.parent.childrenThatAreLibs;

    childrenLibs.forEach(child => {

      const libName = child.name;

      if ((['lib', 'custom/lib', 'app', 'custom/app',] as ModType[]).includes(modType)) {
        //#region  find propert source folder for lib
        let sourceFolder: string;
        if (child.typeIs('angular-lib')) {
          sourceFolder = config.folder.components;
        }
        if (child.typeIs('isomorphic-lib')) {
          sourceFolder = config.folder.src;
        }
        //#endregion

        //#region replace libname/(dist|bundle|browser|browser-for..etc..) ->  libname/(src|components) for user visible code
        const process = (compiledFolders: any[]) => {
          input = impReplace({
            name: `${libName}/${compiledFolders.join('|\n')} -> ${libName}/(${sourceFolder})`,
            project: this.project,
            input,
            modType,
            urlParts: [libName, compiledFolders],
            partsReplacements: [libName, sourceFolder],
            relativePath,
            method
          });
        };
        let folders = this.foldersCompiledJsDtsMap;
        process(folders);
        if (!this.project.isStandaloneProject) {
          folders = this.project.parent.childrenThatAreClients.map(client => {
            return Helpers.getBrowserVerPath(client.name);
          });
          process(folders);
        }
        //#endregion
      }

      if ((['tmp-src-for'] as ModType[]).includes(modType)) {
        //#region fix for tmp-src-for when refering to browser-for-wrong-client-name
        let clientName = relativePath.split('/')[0]
        clientName = clientName.replace(`tmp-src-dist-browser-for-`, '');
        const browserForCurrentClient = Helpers.getBrowserVerPath(clientName);
        const process = (compiled: any[]) => {
          // console.log(`${libName}/${compiled.join('|\n')} -> ${libName}/${browserForCurrentClient}`)
          input = impReplace({
            name: `${libName}/${compiled.join('|\n')} -> ${libName}/${browserForCurrentClient}`,
            project: this.project,
            input,
            modType,
            urlParts: [libName, compiled],
            partsReplacements: [libName, browserForCurrentClient],
            relativePath,
            method
          });
        };
        process(this.foldersSources);
        //#endregion
      }

      if ((['tmp-src'] as ModType[]).includes(modType) && this.project.typeIs('angular-lib')) {
        //#region replace libname/(<anything>) => libname/browser-for-<current-client-name>
        const process = (compiled: any[]) => {
          if (libName === this.project.name) {
            input = impReplace({
              name: `${libName}/${compiled.join('|\n')} -> ${config.folder.components}`,
              project: this.project,
              input,
              modType,
              urlParts: [libName, compiled],
              partsReplacements: [config.folder.components],
              relativePath,
              method
            });
          } else {
            const browserForCurrentClient = Helpers.getBrowserVerPath(this.project.name);
            input = impReplace({
              name: `${libName}/${compiled.join('|\n')} -> ${libName}/${browserForCurrentClient}`,
              project: this.project,
              input,
              modType,
              urlParts: [libName, compiled],
              partsReplacements: [libName, browserForCurrentClient],
              relativePath,
              method
            });
          }
        }
        let folders = [
          ...this.foldersSources,
          ...this.foldersCompiledJsDtsMap,
        ];
        process(folders);
        folders = this.project.isStandaloneProject ? [] : this.project.parent.childrenThatAreClients
          .filter(f => f.name !== this.project.name)
          .map(client => {
            return Helpers.getBrowserVerPath(client.name)
          });
        process(folders);
        //#endregion
      }

    });
    return input;
  }

  /**
   * ONLY FOR BROWSER CODE CUT
   */
  public replaceBaslieneFromSiteBeforeBrowserCodeCut(input: string) {
    // run before browser codecut/compilation

    if (this.project.isSiteInStrictMode) {
      const baselineName = this.project.parent.baseline.name;
      const regexSource = `(\\"|\\')${Helpers.escapeStringForRegEx(baselineName)}\\/`;
      const regex = new RegExp(regexSource, 'g');
      input = Helpers.tsCodeModifier.replace(input, regex, `'`);
    }
    if (this.project.isSiteInDependencyMode) {
      const baselineName = this.project.parent.baseline.name;
      const libs = this.project.parent.childrenThatAreLibs
        .map(c => Helpers.escapeStringForRegEx(c.name)).join('|');
      const sourceFolders = [
        config.folder.components,
        config.folder.src,
        config.folder.dist,
        config.folder.bundle,
      ].map(c => Helpers.escapeStringForRegEx(c)).join('|');
      const regexSource = `(\\"|\\')${Helpers.escapeStringForRegEx(baselineName)}\\/${libs}\\/${sourceFolders}`;
      const regex = new RegExp(regexSource, 'g');
      let libsDetected = input.match(regex);
      libsDetected = (libsDetected ? (libsDetected
        .map(part => {
          part = part.slice(1);
          const split = part.split('/');
          if (split.length !== 3) {
            return void 0;
          }
          return part[1];
        }).filter(f => !!f)) : []);
      libsDetected.forEach(libName => {
        const libNamEscaped = Helpers.escapeStringForRegEx(libName);
        const regexSourceForLib = `(\\"|\\')${Helpers.escapeStringForRegEx(baselineName)}\\/${libNamEscaped}\\/${sourceFolders}`;
        const regexForLib = new RegExp(regexSourceForLib, 'g');
        const browserForClientName = Helpers.getBrowserVerPath(this.project.name);
        input = Helpers.tsCodeModifier.replace(input, regexForLib, `'${baselineName}/${libName}/${browserForClientName}`);
      });
    }

    return input;
  }

}
