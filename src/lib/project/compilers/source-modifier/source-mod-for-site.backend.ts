import { _ } from 'tnp-core';
import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { ModType, CheckType } from './source-modifier.models';

import { impReplace } from './source-modifier.helpers.backend';
import { SourceModForWorkspaceChilds } from './source-mod-for-worspace-childs.backend';

export class SourceModForSite extends SourceModForWorkspaceChilds {

  protected modSiteChildrenLibsInClient(input: string, modType: ModType, relativePath: string): string {
    const method: CheckType = 'site';
    if (!this.project.isSite) {
      // log(`Project is not site: ${this.project.genericName}`);
      return input;
    }

    const chidren = this.project.parent.childrenThatAreLibs;
    const baselineName = this.project.parent.baseline.name;

    chidren.forEach(child => {
      const libName = child.name;

      if (modType === 'lib' || modType === 'custom/lib' || modType === 'app' || modType === 'custom/app') {

        //#region find propert source folder for lib
        let sourceFolder: string;
        if (child.typeIs('angular-lib')) {
          sourceFolder = config.folder.components;
        }
        if (child.typeIs('isomorphic-lib')) {
          sourceFolder = config.folder.src;
        }
        //#endregion

        //#region set propert folder (src or components) for angular-lib or isomorphic-lib inside user editable files
        const process = (compiled: any[]) => {

          input = impReplace({
            name: `
      ${baselineName}/${libName}/${compiled.join('|\n')} -> ${baselineName}/${libName}/${sourceFolder}`,
            project: this.project,
            input,
            modType,
            urlParts: [baselineName, libName, compiled],
            partsReplacements: [baselineName, libName, sourceFolder],
            relativePath,
            method
          });
        };

        let folders = this.foldersCompiledJsDtsMap;
        process(folders);

        folders = this.project.isStandaloneProject ? [] : this.project.parent.childrenThatAreClients.map(client => {
          return Helpers.getBrowserVerPath(client.name, this.websql);
        });
        process(folders);
        //#endregion
      }

      if (modType === 'tmp-src' && this.project.typeIs('isomorphic-lib') && this.project.isSiteInStrictMode) {
        //#region find propert source folder for lib
        let sourceFolder: string;
        if (child.typeIs('angular-lib')) {
          sourceFolder = config.folder.components;
        }
        if (child.typeIs('isomorphic-lib')) {
          sourceFolder = config.folder.src;
        }
        //#endregion

        //#region in strict site replace (prefixed with baseline) libname/(any folder) with libname/(proper source folders src|components)
        const process = (compiled: any[]) => {

          input = impReplace({
            name: `
      ${baselineName}/${libName}/${compiled.join('|\n')} -> ${libName}/${sourceFolder}`,
            project: this.project,
            input,
            modType,
            urlParts: [baselineName, libName, compiled],
            partsReplacements: [libName, sourceFolder],
            relativePath,
            method
          });
        };
        let folders = this.foldersSources;
        process(folders);
        //#endregion
      }

      if (modType === 'tmp-src' && this.project.typeIsNot('isomorphic-lib') && this.project.isSiteInStrictMode) {
        //#region in temp-src folder for angular app in angular-lib replace (prefixed with baseline name) components or src with 'browser-for-client-name folder' or 'components' if lib name is the same
        const process = (compiled: any[]) => {
          if (child.typeIs('angular-lib')) {
            compiled = compiled.filter(f => f !== config.folder.src);
          };

          if (libName === this.project.name && child.typeIs('angular-lib')) {
            input = impReplace({
              name: `${baselineName}/${libName}/(${compiled.join('|\n')}) -> ${config.folder.components}`,
              project: this.project,
              input,
              modType,
              urlParts: [baselineName, libName, compiled],
              partsReplacements: [config.folder.components],
              partsReplacementsOptions: {
                replaceWhole: true
              },
              relativePath,
              method
            });
          } else {
            const browserForCurrentClient = Helpers.getBrowserVerPath(this.project.name, this.websql);
            input = impReplace({
              name: `${baselineName}/${libName}/(${compiled.join('|\n')}) -> ${libName}/${browserForCurrentClient}`,
              project: this.project,
              input,
              modType,
              urlParts: [baselineName, libName, compiled],
              partsReplacements: [libName, browserForCurrentClient],
              relativePath,
              method
            });
          }
        };

        let folders = [
          ...this.foldersSources,
          ...this.foldersCompiledJsDtsMap,
        ];
        process(folders);
        folders = this.project.isStandaloneProject ? [] : this.project.parent.childrenThatAreClients
          .map(client => {
            return Helpers.getBrowserVerPath(client.name, this.websql);
          });
        process(folders);
        //#endregion
      }

      if ((['tmp-src', 'tmp-src-for'] as ModType[]).includes(modType) && this.project.isSiteInDependencyMode) {
        //#region  in temporary folders replace (prefixed with baseline name) components or src folder with 'browser-for-client-name folder'
        const process = (compiled: any[]) => {
          if (child.typeIs('angular-lib')) {
            compiled = compiled.filter(f => f !== config.folder.src);
          };
          const browserForCurrentClient = Helpers.getBrowserVerPath(this.project.name, this.websql);
          input = impReplace({
            name: `${baselineName}/${libName}/(${compiled.join('|\n')}) -> ${baselineName}/${libName}/${browserForCurrentClient}`,
            project: this.project,
            input,
            modType,
            urlParts: [baselineName, libName, compiled],
            partsReplacements: [baselineName, libName, browserForCurrentClient],
            relativePath,
            method
          });
        };
        let folders = [
          ...this.foldersSources,
          ...this.foldersCompiledJsDtsMap,
        ];
        process(folders);
        folders = this.project.isStandaloneProject ? [] : this.project.parent.childrenThatAreClients
          .map(client => {
            return Helpers.getBrowserVerPath(client.name, this.websql);
          });
        process(folders);
      }
      //#endregion
    });


    return input;
  }

}
