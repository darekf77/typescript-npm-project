import * as _ from 'lodash';
import { SourceModForStandaloneProjects } from './source-mod-for-standalone-projects.backend';
import { replace } from './replace';
import config from '../../../config';
import { escapeStringForRegEx, info, log, warn } from '../../../helpers';
import { ModType } from './source-code-type';
import { Project } from '../../abstract';
import { IncrementalBuildProcessExtended } from '../build-isomorphic-lib';

export type ImpReplaceOptions = {
  debugMatch?: boolean;
  debugNotMatch?: boolean;
  project: Project,
  modType: ModType,
  urlParts: (string | string[])[],
  partsReplacements: (string | string[])[],
  name: string;
  input: string,
}

function impReplace(impReplaceOptions: ImpReplaceOptions) {
  let { input, name, urlParts, modType } = impReplaceOptions;
  const { partsReplacements, project, debugMatch, debugNotMatch } = impReplaceOptions;

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

  modType = modType ? modType : 'BROWSER' as any;

  const arr: { regexSource: string; replacement: string; description: string; }[] = [
    {
      regexSource: `(\\"|\\')${urlParts.join(`\\/`)}(\\"|\\')`,
      replacement: `'${partsReplacements.join('/')}'`,
      description: `exactly between apostrophes`
    },
    {
      regexSource: `(\\"|\\')${urlParts.join(`\\/`)}\\/`,
      replacement: `'${partsReplacements.join('/')}/`,
      description: `between apostrophe and slash`
    },
  ];

  for (let index = 0; index < arr.length; index++) {
    const element = arr[index];
    const regex = new RegExp(element.regexSource, 'g');
    const isMatch = regex.test(input);
    input = replace(input, regex, element.replacement);
    if (isMatch) {
      debugMatch && info(`(${modType})(${project.isSite ? 'SITE - ' : ''}"${project.genericName}") (${element.description})` +
        `MATCH: ${name}` +
        `REGEX: ${element.regexSource}\n`);
    } else {
      debugNotMatch && log(`(${modType})(${project.isSite ? 'SITE - ' : ''}"${project.genericName}") (${element.description})` +
        `DON'T MATCH: ${name}` +
        `DON'T REGEX: ${element.regexSource}\n`)
    }
  }



  return input;
}

export class SourceModForWorkspaceChilds extends SourceModForStandaloneProjects {
  constructor(public project: Project) {
    super(project);
  }

  process(input: string, modType: ModType = 'lib') {
    input = super.process(input, modType);
    input = this.mod3rdPartyLibsReferces(input, modType);
    input = this.modWorkspaceChildrenLibsBetweenItself(input, modType);
    input = this.modSiteChildrenLibsInClient(input, modType);
    return input;
  }

  protected mod3rdPartyLibsReferces(input: string, modType: ModType): string {
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
        });
      }

      if (modType === 'app' || modType === 'custom/app') {
        input = impReplace({
          name: `${libName} -> ${libName}/${config.folder.browser}`,
          project: this.project,
          input,
          modType,
          urlParts: [libName],
          partsReplacements: [libName, config.folder.browser],
        });

        input = impReplace({
          name: `${libName}/(${folders.join('|\n')}) -> ${libName}/${config.folder.browser}`,
          project: this.project,
          input,
          modType,
          urlParts: [libName, folders],
          partsReplacements: [libName, config.folder.browser],
        });
      }

    });

    return input;
  }

  protected modWorkspaceChildrenLibsBetweenItself(input: string, modType: ModType): string {

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
            partsReplacements: [libName, sourceFolder]
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
              partsReplacements: [config.folder.components]
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
              partsReplacements: [libName, browserForCurrentClient]
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

  protected modSiteChildrenLibsInClient(input: string, modType: ModType): string {
    if (!this.project.isSite) {
      log(`Project is not site: ${this.project.genericName}`);
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
            partsReplacements: [baselineName, libName, sourceFolder]
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
          const browserForCurrentClient = IncrementalBuildProcessExtended
            .getBrowserVerPath(this.project.name);

          input = impReplace({
            name: `${baselineName}/${libName}/${compiled.join('|\n')} -> ${baselineName}/${libName}/${browserForCurrentClient}`,
            project: this.project,
            input,
            modType,
            urlParts: [baselineName, libName, compiled],
            partsReplacements: [baselineName, libName, browserForCurrentClient]
          });
        };

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

      if (modType === 'app') {

        const process = (compiled: any[]) => {
          if (libName === this.project.name || this.project.type === 'angular-lib') {
            input = impReplace({
              name: `${baselineName}/${libName}/(${compiled.join('|\n')}) -> ${config.folder.components}`,
              project: this.project,
              input,
              modType,
              urlParts: [baselineName, libName, compiled],
              partsReplacements: [config.folder.components]
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
              partsReplacements: [libName, browserForCurrentClient]
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


  /**
   * ONLY FOR BROWSER CODE CUT
   */
  public replaceBaslieneFromSiteBeforeBrowserCodeCut(input: string) {
    // TODO run before browser codecut/compilation

    if (!this.project.isSite) {
      log(`Project is not site: ${this.project.genericName}`);
    }

    const baselineName = this.project.parent.baseline.name;
    const regexSource = `(\\"|\\')${escapeStringForRegEx(baselineName)}\\/`;
    const regex = new RegExp(regexSource, 'g');
    input = replace(input, regex, `'`);

    return input;
  }

}
