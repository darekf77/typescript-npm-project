import * as _ from 'lodash';
import { SourceModForStandaloneProjects } from './source-mod-for-standalone-projects.backend';
import { replace } from './replace';
import config from '../../../config';
import { escapeStringForRegEx, info, log, warn } from '../../../helpers';
import { ModType } from './source-code-type';
import { Project } from '../../abstract';
import { IncrementalBuildProcessExtended } from '../build-isomorphic-lib';

export type CheckType = 'standalone' | 'baseline' | 'site';

export type ImpReplaceOptions = {
  debugMatch?: boolean;
  debugNotMatch?: boolean;
  relativePath: string,
  project: Project,
  method: CheckType,
  modType: ModType,
  partsReplacementsOptions?: { replaceWhole?: boolean };
  urlParts: (string | string[])[],
  notAllowedAfterSlash?: (string | string[])[],
  partsReplacements: (string | string[])[],
  name: string;
  input: string,
}

function impReplace(impReplaceOptions: ImpReplaceOptions) {
  let { input, name, urlParts, modType, notAllowedAfterSlash, partsReplacementsOptions,
    debugMatch, debugNotMatch } = impReplaceOptions;
  const { partsReplacements, project, relativePath, method, } = impReplaceOptions;

  if (!partsReplacementsOptions) {
    partsReplacementsOptions = {};
  }
  if (_.isUndefined(partsReplacementsOptions.replaceWhole)) {
    partsReplacementsOptions.replaceWhole = false;
  }
  const { replaceWhole } = partsReplacementsOptions;


  // if (relativePath === 'custom/src/app/+preview-components/components/+preview-buildtnpprocess/preview-buildtnpprocess.component.ts'
  //   && method === 'site') {
  //   debugMatch = true;
  //   debugNotMatch = true;
  // }


  name = name.replace(/\n/g, ' ')

  urlParts = urlParts.map(p => {
    if (_.isArray(p)) {
      return `(${p
        .map(part => {
          if (part === config.folder.browser) {
            return `${escapeStringForRegEx(part)}(?!\\-)`;
          }
          return escapeStringForRegEx(part);
        }).join('|')})`;
    }
    if (_.isString(p)) {
      return escapeStringForRegEx(p);
    }
  });

  if (_.isArray(notAllowedAfterSlash)) {
    notAllowedAfterSlash = notAllowedAfterSlash.map(p => {
      if (_.isArray(p)) {
        return `(${p
          .map(part => {
            return escapeStringForRegEx(part);
          }).join('|')})`;
      }
      if (_.isString(p)) {
        return escapeStringForRegEx(p);
      }
    });
  }


  modType = modType ? modType : 'BROWSER' as any;

  let arr: { regexSource: string; replacement: string; description: string; }[] = [];
  if (replaceWhole) {
    arr = [
      {
        regexSource: `(\\"|\\')${urlParts.join(`\\/`)}.*(\\"|\\')`,
        replacement: `'${partsReplacements.join('/')}'`,
        description: `exactly between whole imporrt`
      }
    ];
  } else {
    arr = [
      {
        regexSource: `(\\"|\\')${urlParts.join(`\\/`)}(\\"|\\')`,
        replacement: `'${partsReplacements.join('/')}'`,
        description: `exactly between apostrophes`
      },
      {
        regexSource: `(\\"|\\')${urlParts.join(`\\/`)}\\/${notAllowedAfterSlash ? `(?!(${notAllowedAfterSlash.join('|')}))` : ''}`,
        replacement: `'${partsReplacements.join('/')}/`,
        description: `between apostrophe and slash`
      },
    ];
  }



  for (let index = 0; index < arr.length; index++) {
    const element = arr[index];
    const regex = new RegExp(element.regexSource, 'g');
    const isMatch = regex.test(input);
    input = replace(input, regex, element.replacement);
    if (isMatch) {
      debugMatch && info(`(${modType})(${project.isSite ? 'SITE - ' : ''}"${project.genericName}") (${element.description})` +
        `\nMATCH: ${element.regexSource}` +
        `\nREGEX: ${element.regexSource}`) +
        `\nFILE: ${relativePath}\n`;
    } else {
      debugNotMatch && log(`(${modType})(${project.isSite ? 'SITE - ' : ''}"${project.genericName}") (${element.description})` +
        `\nDON'T MATCH: ${element.regexSource}` +
        `\nDON'T REGEX: ${element.regexSource}`) +
        `\nFILE: ${relativePath}\n`;
    }
  }



  return input;
}

export class SourceModForWorkspaceChilds extends SourceModForStandaloneProjects {
  constructor(public project: Project) {
    super(project);
  }

  process(input: string, modType: ModType = 'lib', relativePath: string) {
    input = super.process(input, modType, relativePath);
    input = this.mod3rdPartyLibsReferces(input, modType, relativePath);
    input = this.modWorkspaceChildrenLibsBetweenItself(input, modType, relativePath);
    input = this.modSiteChildrenLibsInClient(input, modType, relativePath);
    return input;
  }

  protected mod3rdPartyLibsReferces(input: string, modType: ModType, relativePath: string): string {
    const method: CheckType = 'standalone';
    const folders = [
      ...this.foldersSources,
      ...this.foldersCompiledJsDtsMap,
    ];

    const children = this.project.parent.childrenThatAreThirdPartyInNodeModules;

    children.forEach(child => {
      const libName = child.name;

      if (modType === 'lib' || modType === 'custom/lib') {
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

      if (modType === 'app' || modType === 'custom/app') {
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

  protected modWorkspaceChildrenLibsBetweenItself(input: string, modType: ModType, relativePath: string): string {
    const method: CheckType = 'baseline';
    const childrenLibs = this.project.parent.childrenThatAreLibs;

    childrenLibs.forEach(child => {

      const libName = child.name;

      if (modType === 'lib' || modType === 'custom/lib') {

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

      if (modType === 'app' || modType === 'custom/app') {

        const process = (compiled: any[]) => {

          if (libName === this.project.name || this.project.type === 'angular-lib') {
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

      if (modType === 'lib' || modType === 'custom/lib') {

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

      if (modType === 'custom/app') {
        const process = (compiled: any[]) => {
          // const browserForCurrentClient = IncrementalBuildProcessExtended
          //   .getBrowserVerPath(this.project.name);

          let sourceFolder: string;
          if (child.type === 'angular-lib') {
            sourceFolder = config.folder.components;
          }
          if (child.type === 'isomorphic-lib') {
            sourceFolder = config.folder.src;
          }

          input = impReplace({
            name: `${baselineName}/${libName}/${compiled.join('|\n')} -> ${baselineName}/${libName}/${sourceFolder}`,
            project: this.project,
            input,
            modType,
            urlParts: [baselineName, libName, compiled],
            partsReplacements: [baselineName, libName, sourceFolder],
            relativePath,
            method
          });
        };

        let folders = [
          // ...this.foldersSources,
          ...this.foldersCompiledJsDtsMap,
        ];

        process(folders);

        folders = this.project.parent.childrenThatAreClients
          .map(client => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(client.name)
          });

        process(folders);
      }

      if (modType === 'app') {

        const process = (compiled: any[]) => {
          if (child.type === 'angular-lib') {
            compiled = compiled.filter(f => f !== config.folder.src);
          };

          if (libName === this.project.name || child.type === 'angular-lib') {
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
    // TODO run before browser codecut/compilation

    if (!this.project.isSite) {
      // log(`Project is not site: ${this.project.genericName}`);
      return input;
    }

    const baselineName = this.project.parent.baseline.name;
    const regexSource = `(\\"|\\')${escapeStringForRegEx(baselineName)}\\/`;
    const regex = new RegExp(regexSource, 'g');
    input = replace(input, regex, `'`);

    return input;
  }

}
