import * as _ from 'lodash';
import * as path from 'path';
import { SourceModForStandaloneProjects } from './source-mod-for-standalone-projects.backend';
import { config } from '../../../config';
import { Helpers } from 'tnp-helpers';
import { ModType, CheckType } from './source-modifier.models';

import { impReplace } from './source-modifier.helpers.backend';

const debugFiles = [
  // 'tmp-src/app/app.component.ts'
]

export class SourceModForWorkspaceChilds extends SourceModForStandaloneProjects {


  protected modWorkspaceChildrenLibsBetweenItself(
    input: string, modType: ModType, relativePath: string): string {

    const debug = debugFiles.includes(relativePath);

    const method: CheckType = 'baseline';
    const childrenLibs = this.project.parent.childrenThatAreLibs;
    debug && Helpers.log(`[modWorkspaceChildrenLibsBetweenItself]  childrenLibs: \n\n ${childrenLibs.map(c => c.name).join('\n')} \n\n`);

    childrenLibs.forEach(child => {

      const libName = child.name;

      if (([
        'tmp-src-for'
      ] as ModType[]).includes(modType)) {
        // if (relativePath === 'tmp-src-dist-browser-for-test-ui-lib/test-ui-mod/test-ui-mod.component.ts') {
        //   console.log('PROCESSING!', JSON.stringify({ modType, libName }))
        // }

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

      }

      if (([
        'lib',
        'custom/lib',
        'app',
        'custom/app',
      ] as ModType[]).includes(modType)) {

        let sourceFolder: string;
        if (child.typeIs('angular-lib')) {
          sourceFolder = config.folder.components;
        }
        if (child.typeIs('isomorphic-lib')) {
          sourceFolder = config.folder.src;
        }

        const process = (compiledFolders: any[]) => {
          input = impReplace({
            name: `
 ${libName}/${compiledFolders.join('|\n')} -> ${libName}/(${sourceFolder})`,
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

        folders = this.project.isStandaloneProject ? [] : this.project.parent.childrenThatAreClients.map(client => {
          return Helpers.getBrowserVerPath(client.name);
        });
        process(folders);
      }

      if (modType === 'tmp-src' && this.project.typeIs('angular-lib')) {

        debug && Helpers.log(`Should be processed ${relativePath}`)

        const process = (compiled: any[]) => {

          if (libName === this.project.name) {
            debug && Helpers.log(`COMPONENTS TO BROWSER FOR ${relativePath}`)
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


      }

    });
    return input;
  }

  protected modSiteChildrenLibsInClient(input: string, modType: ModType, relativePath: string): string {
    const method: CheckType = 'site';
    if (!this.project.isSiteInStrictMode) {
      // log(`Project is not site: ${this.project.genericName}`);
      return input;
    }

    const chidren = this.project.parent.childrenThatAreLibs;
    const baselineName = this.project.parent.baseline.name;

    chidren.forEach(child => {

      const libName = child.name;

      if (modType === 'lib' || modType === 'custom/lib' || modType === 'app' || modType === 'custom/app') {

        let sourceFolder: string;
        if (child.typeIs('angular-lib')) {
          sourceFolder = config.folder.components;
        }
        if (child.typeIs('isomorphic-lib')) {
          sourceFolder = config.folder.src;
        }

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
          return Helpers.getBrowserVerPath(client.name);
        });
        process(folders);

      }

      // TODO delete this ?
      // Angulair lib and generala angular-clint...
      // there is a problem with join for ${config.frameworkName} baw

      // tnp-src should wokr for copy of app/src in clients

      // if (modType === 'tmp-src') {
      //   console.log(relativePath)
      // }



      // if (modType === 'custom/app') {
      //   const process = (compiled: any[]) => {
      //     // const browserForCurrentClient = IncrementalBuildProcessExtended
      //     //   .getBrowserVerPath(this.project.name);

      //     let sourceFolder: string;
      //     if (child.type === 'angular-lib') {
      //       sourceFolder = config.folder.components;
      //     }
      //     if (child.type === 'isomorphic-lib') {
      //       sourceFolder = config.folder.src;
      //     }

      //     input = impReplace({
      //       name: `${baselineName}/${libName}/${compiled.join('|\n')} -> ${baselineName}/${libName}/${sourceFolder}`,
      //       project: this.project,
      //       input,
      //       modType,
      //       urlParts: [baselineName, libName, compiled],
      //       partsReplacements: [baselineName, libName, sourceFolder],
      //       relativePath,
      //       method
      //     });
      //   };

      //   let folders = [
      //     // ...this.foldersSources,
      //     ...this.foldersCompiledJsDtsMap,
      //   ];

      //   process(folders);

      //   folders = this.project.isStandaloneProject ? [] : this.project.parent.childrenThatAreClients
      //     .map(client => {
      //       return Helpers.getBrowserVerPath(client.name)
      //     });

      //   process(folders);
      // }

      if (modType === 'tmp-src' && this.project.typeIs('isomorphic-lib')) {
        // console.log('1', relativePath)
        let sourceFolder: string;
        if (child.typeIs('angular-lib')) {
          sourceFolder = config.folder.components;
        }
        if (child.typeIs('isomorphic-lib')) {
          sourceFolder = config.folder.src;
        }

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
      }

      if (modType === 'tmp-src' && this.project.typeIsNot('isomorphic-lib')) {

        // console.log('2', relativePath)
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

            const browserForCurrentClient = Helpers.getBrowserVerPath(this.project.name);

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
        }

        let folders = [
          ...this.foldersSources,
          ...this.foldersCompiledJsDtsMap,
        ];

        process(folders);

        folders = this.project.isStandaloneProject ? [] : this.project.parent.childrenThatAreClients
          .map(client => {
            return Helpers.getBrowserVerPath(client.name);
          });

        process(folders);

      }

    });

    return input;
  }


  /**
   * ONLY FOR BROWSER CODE CUT
   */
  public replaceBaslieneFromSiteBeforeBrowserCodeCut(input: string) {
    // run before browser codecut/compilation

    if (!this.project.isSiteInStrictMode) {
      // log(`Project is not site: ${this.project.genericName}`);
      return input;
    }

    const baselineName = this.project.parent.baseline.name;
    const regexSource = `(\\"|\\')${Helpers.escapeStringForRegEx(baselineName)}\\/`;
    const regex = new RegExp(regexSource, 'g');
    input = Helpers.tsCodeModifier.replace(input, regex, `'`);

    return input;
  }

}
