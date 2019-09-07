import * as _ from 'lodash';
import { SourceModForStandaloneProjects } from './source-mod-for-standalone-projects.backend';
import { config } from '../../../config';
import { Helpers } from '../../../helpers';
import { ModType, SourceCodeType, CheckType } from './source-modifier.models';
import { Project } from '../../abstract';
import { IncrementalBuildProcessExtended } from '../build-isomorphic-lib';
import { impReplace } from './source-modifier.helpers.backend';

export class SourceModForWorkspaceChilds extends SourceModForStandaloneProjects {

  process(input: string, relativePath: string) {
    const modType = this.getModType(this.project, relativePath);
    input = Helpers.tsCodeModifier.fixDoubleApostophe(input);
    input = super.process(input, relativePath);
    input = this.modWorkspaceChildrenLibsBetweenItself(input, modType, relativePath);
    input = this.modSiteChildrenLibsInClient(input, modType, relativePath);
    return input;
  }


  protected modWorkspaceChildrenLibsBetweenItself(
    input: string, modType: ModType, relativePath: string): string {

    const method: CheckType = 'baseline';
    const childrenLibs = this.project.parent.childrenThatAreLibs;

    childrenLibs.forEach(child => {

      const libName = child.name;

      if (modType === 'lib' || modType === 'custom/lib' || modType === 'app' || modType === 'custom/app') {

        let sourceFolder: string;
        if (child.type === 'angular-lib') {
          sourceFolder = config.folder.components;
        }
        if (child.type === 'isomorphic-lib') {
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

        folders = this.project.parent.childrenThatAreClients.map(client => {
          return IncrementalBuildProcessExtended.getBrowserVerPath(client.name);
        });
        process(folders);
      }

      if (modType === 'tmp-src' && this.project.type === 'angular-lib') {

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

            const browserForCurrentClient = IncrementalBuildProcessExtended
              .getBrowserVerPath(this.project.name);

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

        folders = this.project.parent.childrenThatAreClients
          .filter(f => f.name !== this.project.name)
          .map(client => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(client.name)
          });

        process(folders);


      }

    });
    return input;
  }

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

        let sourceFolder: string;
        if (child.type === 'angular-lib') {
          sourceFolder = config.folder.components;
        }
        if (child.type === 'isomorphic-lib') {
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

        folders = this.project.parent.childrenThatAreClients.map(client => {
          return IncrementalBuildProcessExtended.getBrowserVerPath(client.name);
        });
        process(folders);

      }

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

      //   folders = this.project.parent.childrenThatAreClients
      //     .map(client => {
      //       return IncrementalBuildProcessExtended.getBrowserVerPath(client.name)
      //     });

      //   process(folders);
      // }

      if (modType === 'tmp-src' && this.project.type === 'isomorphic-lib') {
        // console.log('1', relativePath)
        let sourceFolder: string;
        if (child.type === 'angular-lib') {
          sourceFolder = config.folder.components;
        }
        if (child.type === 'isomorphic-lib') {
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

      if (modType === 'tmp-src' && this.project.type !== 'isomorphic-lib') {

        // console.log('2', relativePath)
        const process = (compiled: any[]) => {
          if (child.type === 'angular-lib') {
            compiled = compiled.filter(f => f !== config.folder.src);
          };

          if (libName === this.project.name && child.type === 'angular-lib') {
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

            const browserForCurrentClient = IncrementalBuildProcessExtended
              .getBrowserVerPath(this.project.name);

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

        folders = this.project.parent.childrenThatAreClients
          .map(client => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(client.name);
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

    if (!this.project.isSite) {
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
