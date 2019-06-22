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
  let { input, name, urlParts,
    partsReplacements, modType,
    project, debugMatch, debugNotMatch } = impReplaceOptions;

  name = name.replace(/\n/g, ' ')

  urlParts = urlParts.map(p => {
    if (_.isArray(p)) {
      return `(${p.map(part => escapeStringForRegEx(part)).join('|')})`
    }
    if (_.isString(p)) {
      return escapeStringForRegEx(p);
    }
  });

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
  };

  mod3rdPartyLibsReferces(input: string, modType: ModType): string {
    const folderForO3rdPartLibs = [
      ...this.foldersSources,
      ...this.foldersCompiledJsDtsMap,
    ];

    const children = this.project.parent.childrenThatAreThirdPartyInNodeModules;

    children.forEach(child => {
      const libName = child.name;

      if (modType === 'lib' || modType === 'custom/lib') {
        input = impReplace({
          name: `<isomorphic-lib-name>/${folderForO3rdPartLibs.join('|\n')} -> <isomorphic-lib-name>`,
          project: this.project,
          input,
          modType,
          urlParts: [libName, folderForO3rdPartLibs],
          partsReplacements: [libName],
        });
      }

      if (modType === 'app' || modType === 'custom/app') {
        input = impReplace({
          name: `<isomorphic-lib-name> -> <isomorphic-lib-name>/browser`,
          project: this.project,
          input,
          modType,
          urlParts: [libName],
          partsReplacements: [libName, config.folder.browser],
        });

        input = impReplace({
          name: `<isomorphic-lib-name>/(${folderForO3rdPartLibs.join('|\n')}) -> <isomorphic-lib-name>/browser`,
          project: this.project,
          input,
          modType,
          urlParts: [libName, folderForO3rdPartLibs],
          partsReplacements: [libName, config.folder.browser],
        });
      }

    });

    return input;
  }

  modWorkspaceChildrenLibsBetweenItself(input: string, modType: ModType): string {

    const childrenLibs = this.project.parent.childrenThatAreLibs;

    childrenLibs.forEach(child => {

      const libName = child.name;

      if (modType === 'lib' || modType === 'custom/lib') {

        let sourceFolder: string;
        if (this.project.type === 'angular-lib') {
          sourceFolder = config.folder.components;
        }
        if (this.project.type === 'isomorphic-lib') {
          sourceFolder = config.folder.src;
        }

        const process = (compiled: any[], preventDash: boolean) => {
          const urlParts = preventDash ? [libName, compiled, `(?!\\-)`] : [libName, compiled];
          input = impReplace({
            name: `
  <workspace-lib-name>/${compiled.join('|\n')} -> <isomorphic-lib-name>/(${this.foldersSources.join('|')})`,
            project: this.project,
            input,
            modType,
            urlParts: _.cloneDeep(urlParts),
            partsReplacements: [libName, sourceFolder]
          });
        };

        let compiled = this.foldersCompiledJsDtsMap;
        process(compiled, true);

        compiled = this.project.parent.childrenThatAreClients.map(client => {
          return IncrementalBuildProcessExtended.getBrowserVerPath(client.name)
        });
        process(compiled, false);
      }

      if (modType === 'app' || modType === 'custom/app') {

        const process = (compiled: any[], preventDash: boolean) => {
          const urlParts = preventDash ? [libName, compiled, `(?!\\-)`] : [libName, compiled];

          if (libName === this.project.name || this.project.type === 'angular-lib') {
            input = impReplace({
              name: `
  <workspace-lib-name>/${compiled.join('|\n')} -> components`,
              project: this.project,
              input,
              modType,
              urlParts: _.cloneDeep(urlParts),
              partsReplacements: [config.folder.components]
            });

          } else {

            const browserForCurrentClient = IncrementalBuildProcessExtended
              .getBrowserVerPath(this.project.name)

            input = impReplace({
              name: `
  <workspace-lib-name>/${compiled.join('|\n')} -> <isomorphic-lib-name>/${browserForCurrentClient}`,
              project: this.project,
              input,
              modType,
              urlParts: _.cloneDeep(urlParts),
              partsReplacements: [libName, browserForCurrentClient]
            });
          }
        }

        let tmpcompiled = [
          ...this.foldersSources,
          ...this.foldersCompiledJsDtsMap,
        ];

        process(tmpcompiled, true);

        tmpcompiled = this.project.parent.childrenThatAreClients
          .filter(f => f.name !== this.project.name)
          .map(client => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(client.name)
          })

        process(tmpcompiled, false);


      }

    });
    return input;
  }

  modSiteChildrenLibsInClient(input: string, modType: ModType): string {
    if (!this.project.isSite) {
      log(`Project is not site: ${this.project.genericName}`);
    }

    const chidren = this.project.parent.childrenThatAreLibs;
    const baselineName = this.project.parent.baseline.name;

    chidren.forEach(child => {

      const libName = child.name;

      if (modType === 'lib' || modType === 'custom/lib') {

        let sourceFolder: string;
        if (this.project.type === 'angular-lib') {
          sourceFolder = config.folder.components;
        }
        if (this.project.type === 'isomorphic-lib') {
          sourceFolder = config.folder.src;
        }

        const process = (compiled: any[], preventDash: boolean) => {
          const urlParts = preventDash ? [baselineName, libName, compiled, `(?!\\-)`] :
            [baselineName, libName, compiled];
          input = impReplace({
            name: `
${baselineName}/<workspace-lib-name>/${compiled.join('|\n')} ->
${baselineName}/<workspace-lib-name>/(${this.foldersSources.join('|')})`,
            project: this.project,
            input,
            modType,
            urlParts: _.cloneDeep(urlParts),
            partsReplacements: [baselineName, libName, sourceFolder]
          });
        };

        let compiled = this.foldersCompiledJsDtsMap;
        process(compiled, true);

        compiled = this.project.parent.childrenThatAreClients.map(client => {
          return IncrementalBuildProcessExtended.getBrowserVerPath(client.name)
        });
        process(compiled, false);

      }

      if (modType === 'custom/app') {
        const process = (compiled: any[], preventDash: boolean) => {
          const urlParts = preventDash ? [baselineName, libName, compiled, `(?!\\-)`] :
            [baselineName, libName, compiled];

          const browserForCurrentClient = IncrementalBuildProcessExtended
            .getBrowserVerPath(this.project.name)

          input = impReplace({
            name: `
${baselineName}/<workspace-lib-name>/${compiled.join('|\n')} ->
${baselineName}/<workspace-lib-name>/${browserForCurrentClient}`,
            project: this.project,
            input,
            modType,
            urlParts: _.cloneDeep(urlParts),
            partsReplacements: [baselineName, libName, browserForCurrentClient]
          });

        };

        let tmpcompiled = [
          ...this.foldersSources,
          ...this.foldersCompiledJsDtsMap,
        ];

        process(tmpcompiled, true);

        tmpcompiled = this.project.parent.childrenThatAreClients
          .filter(f => f.name !== this.project.name)
          .map(client => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(client.name)
          })

        process(tmpcompiled, false);



      }

      if (modType === 'app') {

        const process = (compiled: any[], preventDash: boolean) => {
          const urlParts = preventDash ? [baselineName, libName, compiled, `(?!\\-)`] :
            [baselineName, libName, compiled];

          if (libName === this.project.name || this.project.type === 'angular-lib') {
            input = impReplace({
              name: `
${baselineName}/<workspace-lib-name>/${compiled.join('|\n')} -> components`,
              project: this.project,
              input,
              modType,
              urlParts: _.cloneDeep(urlParts),
              partsReplacements: [config.folder.components]
            });

          } else {

            const browserForCurrentClient = IncrementalBuildProcessExtended
              .getBrowserVerPath(this.project.name)

            input = impReplace({
              name: `
${baselineName}/<workspace-lib-name>/${compiled.join('|\n')} ->
<isomorphic-lib-name>/${browserForCurrentClient}`,
              project: this.project,
              input,
              modType,
              urlParts: _.cloneDeep(urlParts),
              partsReplacements: [libName, browserForCurrentClient]
            });
          }
        }

        let tmpcompiled = [
          ...this.foldersSources,
          ...this.foldersCompiledJsDtsMap,
        ];

        process(tmpcompiled, true);

        tmpcompiled = this.project.parent.childrenThatAreClients
          .filter(f => f.name !== this.project.name)
          .map(client => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(client.name)
          })

        process(tmpcompiled, false);

      }

    })


    return input;
  }


  /**
   * ONLY FOR BROWSER CODE CUT
   */
  replaceBaslieneFromSiteBeforeBrowserCodeCut() {
    // TODO run before browser codecut/compilation
  }

}
