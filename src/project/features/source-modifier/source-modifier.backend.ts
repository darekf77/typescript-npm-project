//#region imports
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
//#endregion

const debugFiles = [
  // 'components/index.ts'
];

export class SourceModifier extends FeatureCompilerForProject {

  //#region get source type lib - for libs, app - for clients
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
  //#endregion



  public static PreventNotUseOfTsSourceFolders(project: Project, relativePath: string, input?: string): string {
    // console.log(`MOD: "${relativePath}"`)
    const debugging = debugFiles.includes(relativePath);
    //#region init
    const saveMode = _.isUndefined(input);
    const modType = this.getModType(project, relativePath);
    const filePath = path.join(project.location, relativePath);
    if (saveMode) {
      input = fse.readFileSync(filePath, {
        encoding: 'utf8'
      });
    }
    debugging && console.log('------------')
    // debugging && console.log(input)
    debugging && console.log('------------')
    //#endregion

    debugging && console.log('modType', modType)


    if (modType === 'lib') {

      /**
       * 'npm-(isomorphic|angular)-lib-name/(not-allowed-folder) => 'npm-(isomorphic|angular)-lib-name
       */
      //#region (npm(isomorphic|angular)-lib-name) normal lib name in lib
      (() => {
        const notallowed = [
          config.folder.browser,
          config.folder.dist,
          config.folder.bundle
        ];
        project.childrenThatAreThirdPartyInNodeModules.forEach((child) => {
          const libName = child.name;
          const regexSourece = `(\\"|\\')${libName}\/(${notallowed.join('|')})`;
          input = replace(input, new RegExp(regexSourece, 'g'), `'${libName}`);
        });
      })();
      //#endregion

      /**
       * (SITE ONLY) 'baseline/libn-name' => 'baseline/libn-name/(src|components)'
       * 'lib-name' => 'lib-name/(src|components)'
       * 'lib-name/(not-allowed-folder) => 'lib-name/(src|components)
       * (SITE ONLY) 'baseline/lib-name/(not-allowed-folder) => 'baseline/lib-name/(src|components)
       */
      //#region Prevent incorect use of libraries in other libraries
      (() => {
        const notallowed = [
          ...project.parent.childrenThatAreLibs.map(c => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(c.name)
          }),
          ...project.parent.childrenThatAreClients.map(c => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(c.name)
          })
        ];

        const notAllowedFor = notallowed.concat([
          config.folder.browser,
          config.folder.dist,
          config.folder.module,
          config.folder.bundle
        ]);

        project.parent.childrenThatAreLibs.forEach((child) => {
          const libName = child.name;

          const sourceFolder = child.type === 'isomorphic-lib' ? config.folder.src :
            (child.type === 'angular-lib' ? config.folder.components : void 0)

          if (project.isSite && project.isWorkspaceChildProject) {
            const regexBaselinePathIncorrenct = `(\\"|\\')${project.parent.baseline.name}\/${libName}(\\"|\\')`;
            input = replace(input, new RegExp(regexBaselinePathIncorrenct, 'g'),
              `'${project.parent.baseline.name}/${libName}/${sourceFolder}'`);
          }

          const regexSoureceForAlone = `(\\"|\\')${libName}(\\"|\\')`;
          input = replace(input, new RegExp(regexSoureceForAlone, 'g'), `'${libName}/${sourceFolder}'`);

          const regexSoureceForNotAllowed = `(\\"|\\')${libName}\/(${notAllowedFor.join('|')})`;
          input = replace(input, new RegExp(regexSoureceForNotAllowed, 'g'), `'${libName}/${sourceFolder}`);

          if (project.isSite && project.isWorkspaceChildProject) {
            const regexSoureceBaselineForNotAllowed = `(\\"|\\')${project.parent.baseline.name}\/${libName}\/(${notAllowedFor.join('|')})`;
            input = replace(input, new RegExp(regexSoureceBaselineForNotAllowed, 'g'),
              `'${project.parent.baseline.name}/${libName}/${sourceFolder}`);
          }

        });
      })();
      //#endregion

      /**
       * 'client-name/src
       * (SITE ONLY) 'baseline/client-name/src
       */
      //#region errors when refering to client inside lib
      (() => {
        project.parent.childrenThatAreClients
          .filter(c => c.type !== 'isomorphic-lib')
          .forEach((child) => {
            const clientName = child.name;

            let regexSourece = `(\\"|\\')${clientName}\/(${config.folder.src})`;
            let matches = input.match(new RegExp(regexSourece, 'g'));
            if (_.isArray(matches)) {
              matches.forEach(m => {
                error(`Please don't use client "${clientName}" inside source code of lib "${project.genericName}":
             files: ${relativePath}
            ...
            ${m}
            ...
             `, true, true)
              });
            }

            if (project.isSite && project.isWorkspaceChildProject) {
              regexSourece = `(\\"|\\')${project.parent.baseline.name}\/${clientName}\/(${config.folder.src})`;
              matches = input.match(new RegExp(regexSourece, 'g'));
              if (_.isArray(matches)) {
                matches.forEach(m => {
                  error(`Please don't use baseline client "${clientName}" inside source code of lib "${project.genericName}":
               files: ${relativePath}
              ...
              ${m}
              ...
               `, true, true)
                });
              }
            }

          });
      })();
      //#endregion

    } else if (modType === 'app') {

      /**
       * 'npm-(isomorphic|angular)-lib-name' => 'npm-(isomorphic|angular)-lib-name/browser'
       * 'npm-(isomorphic|angular)-lib-name/(notallowedfolder) => 'npm-(isomorphic|angular)-lib-name/browser'
       */
      //#region use browser version of npm libs in client
      (() => {
        const notallowed = [config.folder.dist, config.folder.bundle];

        project.parent.childrenThatAreThirdPartyInNodeModules.forEach((child) => {
          const libName = child.name;

          const regexSoureceForAlone = `(\\"|\\')${libName}(\\"|\\')`;

          input = replace(input,
            new RegExp(regexSoureceForAlone, 'g'),
            `'${libName}/${config.folder.browser}'`
          );

          const regexSourece = `(\\"|\\')${libName}\/(${notallowed.join('|')})`;

          input = replace(input,
            new RegExp(regexSourece, 'g'),
            `'${libName}/${config.folder.browser}`
          );

        });
      })();
      //#endregion

      /**
       * (SITE ONLY) 'baseline/anguliar-lib' => 'angular-lib/browser-for-client-name';
       * 'anguliar-lib' => 'angular-lib/browser-for-client-name'
       *
       * (SITE ONLY) 'baseline/anguliar-lib/(not-allowed-folders) => 'angular-lib/browser-for-client-name
       * 'anguliar-lib/(not-allowed-folders) => 'angular-lib/browser-for-client-name
       */
      //#region handle workspace libs names in clients
      (() => {
        const notallowed = [
          config.folder.browser,
          config.folder.dist,
          config.folder.module,
          config.folder.bundle,
          config.folder.src,
          config.folder.components,
        ];

        project.parent.childrenThatAreLibs.forEach((child) => {
          const libName = child.name;


          if (project.isSite && project.isWorkspaceChildProject) {
            const regexSoureceForAlone = `(\\"|\\')${project.parent.baseline.name}\/${libName}(\\"|\\')`;
            input = replace(input,
              new RegExp(regexSoureceForAlone, 'g'),
              `'${libName}/${IncrementalBuildProcessExtended.getBrowserVerPath(project.name)}'`
            );
          }

          const regexSoureceForAlone = `(\\"|\\')${libName}(\\"|\\')`;
          input = replace(input,
            new RegExp(regexSoureceForAlone, 'g'),
            `'${libName}/${IncrementalBuildProcessExtended.getBrowserVerPath(project.name)}'`
          );

          if (project.isSite && project.isWorkspaceChildProject) {
            const regexSoureceForNotAllowed = `(\\"|\\')${project.parent.baseline.name}\/${libName}\/(${notallowed.join('|')})`;
            input = replace(input,
              new RegExp(regexSoureceForNotAllowed, 'g'),
              `'${libName}/${IncrementalBuildProcessExtended.getBrowserVerPath(project.name)}`
            );
          }

          const regexSoureceForNotAllowed = `(\\"|\\')${libName}\/(${notallowed.join('|')})`;
          input = replace(input,
            new RegExp(regexSoureceForNotAllowed, 'g'),
            `'${libName}/${IncrementalBuildProcessExtended.getBrowserVerPath(project.name)}`
          );

        });
      })();
      //#endregion

      /**
       * 'baseline/client-name
       * 'baseline/client-name/(not-allowed-folders)
       * 'client-name
       * 'client-name/(not-allowed-folders)
       */
      //#region hander errors when client code is using client code
      (() => {

        const notallowed = [
          config.folder.browser,
          config.folder.dist,
          config.folder.module,
          config.folder.bundle,
          config.folder.src,
          config.folder.components,
        ];

        project.parent.childrenThatAreClients
          .filter(c => c.type !== 'isomorphic-lib')
          .forEach((child) => {
            const clientName = child.name;

            if (project.isSite && project.isWorkspaceChildProject) {
              const regexSourece = `(\\"|\\')${project.parent.baseline.name}\/${clientName}(\/(${notallowed.join('|')}))*`;
              const matches = input.match(new RegExp(regexSourece, 'g'));
              if (_.isArray(matches)) {
                matches.forEach(m => {
                  error(`Please don't use baseline client ("${project.parent.baseline.name}/${clientName}")
              code inside source code of this client "${project.genericName}":
               files: ${relativePath}
              ...
              ${m}
              ...
               `, true, true)
                });
              }
            }

            const regexSourece = `(\\"|\\')${clientName}(\/(${notallowed.join('|')}))*`;
            const matches = input.match(new RegExp(regexSourece, 'g'));
            if (_.isArray(matches)) {
              matches.forEach(m => {
                error(`Please don't use another client ("${clientName}") code inside source code of this client "${project.genericName}":
             files: ${relativePath}
            ...
            ${m}
            ...
             `, true, true)
              });
            }

          });
      })();
      //#endregion

    }

    //#region save input if save mode
    if (saveMode) {
      fse.writeFileSync(filePath, input, {
        encoding: 'utf8'
      });
    }
    //#endregion

    return input;
  }

  //#region folder patterns fn
  private get foldersPattern() {
    return folderPattern(this.project);
  }
  //#endregion

  //#region constructor
  constructor(public project: Project) {
    super(folderPattern(project), '', project && project.location, project);
  }
  //#endregion

  protected syncAction(): void {
    //#region SYNC ACTION
    const files = glob.sync(this.foldersPattern, { cwd: this.project.location });
    // console.log(files)
    files.forEach(f => {
      SourceModifier.PreventNotUseOfTsSourceFolders(this.project, f)
    });
    //#endregion
  }

  protected preAsyncAction(): void {
    // throw new Error("Method not implemented.");
  }
  protected asyncAction(filePath: string) {
    //#region ASYNC ACTION
    console.log('SOurce modifier async !', filePath)

    // if (fse.existsSync(filePath)) {
    //   this.cb({ path: filePath, contents: fs.readFileSync(filePath, { encoding: 'utf8' }) }, this.options);
    // }
    //#endregion
  }

}

function replace(input: string, regex: RegExp, replacement: string) {

  return input.split('\n').map(line => {
    const lineTrim = line.trim()
    if (lineTrim.startsWith('//')) {
      return line;
    }
    if (
      lineTrim.startsWith('import ') ||
      lineTrim.startsWith('export ') ||
      /^\}\s+from\s+(\"|\')/.test(lineTrim) ||
      /require\((\"|\')/.test(lineTrim)
    ) {
      return line.replace(regex, replacement);
    }
    return line;
  }).join('\n');
}

function folderPattern(project: Project) {
  return `${
    project.isSite ? config.folder.custom : `{${[config.folder.src, config.folder.components].join(',')}}`
    }/**/*.ts`
}
