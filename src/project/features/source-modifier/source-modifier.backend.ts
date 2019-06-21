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
import { error, escapeStringForRegEx, log, warn } from '../../../helpers';
import { replace } from './replace';
import { take } from 'rxjs/operator/take';
//#endregion

const debugFiles = [
  // 'components/index.ts',

];

export class SourceModifier extends FeatureCompilerForProject {

  //#region get source type lib - for libs, app - for clients
  private static getModType(project: Project, relativePath: string): 'app' | 'lib' | 'custom/app' | 'custom/lib' {
    const startFolder: SourceFolder = _.first(relativePath.replace(/^\//, '').split('/')) as SourceFolder;
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

  //#region fix double apostrophes in imports,export, requires
  private static fixDoubleApostophe(input: string) {
    const regex = /(import|export|require\(|\}\sfrom\s(\"|\')).+(\"|\')/g;
    const matches = input.match(regex);
    if (_.isArray(matches)) {
      matches.forEach(m => {
        input = input.replace(m, m.replace(/\"/g, `'`));
      });
    }
    return input;
  }
  //#endregion

  public static PreventNotUseOfTsSourceFolders(project: Project, relativePath: string, input?: string, asyncCall = false): string {
    relativePath = relativePath.replace(/^\//, '');
    // asyncCall && console.log(`MOD: "${relativePath}"`)
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
    input = this.fixDoubleApostophe(input);

    // debugging && console.log('------------')
    // // debugging && console.log(input)
    // debugging && console.log('------------')
    //#endregion

    // asyncCall && console.log('modType', modType)


    if (modType === 'lib' || modType === 'custom/lib') {

      /**
       * FOR: every library
       *
       * 'npm-(isomorphic|angular)-lib-name/(not-allowed-folder) => 'npm-(isomorphic|angular)-lib-name
       */
      //#region (npm(isomorphic|angular)-lib-name) normal lib name in lib
      (() => {
        const escaped_folders = [
          config.folder.browser,
          config.folder.dist,
          config.folder.src,
          config.folder.bundle
        ].map(f => escapeStringForRegEx(f))

        project.childrenThatAreThirdPartyInNodeModules.forEach((child) => {
          const libName = child.name;
          const escaped_libName = escapeStringForRegEx(libName);
          const regexSourece = `(\\"|\\')${escaped_libName}\\/(${escaped_folders.join('|')})`;
          input = replace(input, new RegExp(regexSourece, 'g'), `'${libName}`);
        });
      })();
      //#endregion

      /**
       * 'angular-lib-itself-name/(notallowedfolder)' => ''
       * 'angular-lib-itself-name/(notallowedfolder) => '
       * 'angular-lib-itself-name/ => '
       * 'angular-lib-itself-name => '
       */
      //#region Project inself reference in src/ of angular-lib or isomorphic-lib
      if (project.type === 'angular-lib' || project.type === 'isomorphic-lib') {

        const notAllowedFor = [
          IncrementalBuildProcessExtended.getBrowserVerPath(project.name),
          ...project.parent.childrenThatAreLibs.map(c => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(c.name)
          }),
          ...project.parent.childrenThatAreClients.map(c => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(c.name)
          }),
          config.folder.browser,
          config.folder.dist,
          config.folder.module,
          config.folder.bundle,
          config.folder.components,
        ].map(s => escapeStringForRegEx(s));

        const escaped_project_name = escapeStringForRegEx(project.name);

        (() => {
          const regexSource = `(\\"|\\')${escaped_project_name}\\/(${notAllowedFor.join('|')})(\\"|\\')`;
          const regex = new RegExp(regexSource, 'g');
          // regex.test(input) && w(regexSource)
          input = replace(input, regex, `''`);
        })();

        (() => {
          const regexSource = `(\\"|\\')${escaped_project_name}\\/(${notAllowedFor.join('|')})`;
          // debugging && console.log('regexSoureceForNotAllowed', regexSoureceForNotAllowed)
          const regex = new RegExp(regexSource, 'g');
          // regex.test(input) && w(regexSource)
          input = replace(input, regex, `'`);
        })();

        (() => {
          const regexSource = `(\\"|\\')${escaped_project_name}\\/`;
          const regex = new RegExp(regexSource, 'g')
          // debugging && console.log('regexSoureceForNotAllowed', regexSoureceForNotAllowed)
          // regex.test(input) && w(regexSource)
          input = replace(input, regex, `'`);
        })();

        (() => {
          const regexSource = `(\\"|\\')${escaped_project_name}`;
          const regex = new RegExp(regexSource, 'g')
          // debugging && console.log('regexSoureceForNotAllowed', regexSoureceForNotAllowed)
          // regex.test(input) && w(regexSource)
          input = replace(input, regex, `'`);
        })();

      }
      //#endregion

      /**
       * (SITE ONLY) 'baseline/lib-name' => 'baseline/libn-name/(src|components)'
       * 'lib-name' => 'lib-name/(src|components)'
       * 'lib-name/(not-allowed-folder) => 'lib-name/(src|components)
       * (SITE ONLY) 'baseline/lib-name/(not-allowed-folder) => 'baseline/lib-name/(src|components)
       */
      //#region Prevent incorect use of libraries in other libraries
      (() => {

        const escaped_folders = [
          ...project.parent.childrenThatAreLibs.map(c => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(c.name)
          }),
          ...project.parent.childrenThatAreClients.map(c => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(c.name)
          }),
          config.folder.browser,
          config.folder.dist,
          config.folder.module,
          config.folder.bundle,
          config.folder.components,
          config.folder.src,
        ].map(s => escapeStringForRegEx(s));

        const escaped_project_parent_baseline_name = project.isSite && escapeStringForRegEx(project.parent.baseline.name);

        project.parent.childrenThatAreLibs.forEach((child) => {
          const libName = child.name;
          const escaped_libName = escapeStringForRegEx(libName);

          const sourceFolder = child.type === 'isomorphic-lib' ? config.folder.src :
            (child.type === 'angular-lib' ? config.folder.components : void 0)

          if (project.isSite && project.isWorkspaceChildProject) {
            const regexSource = `(\\"|\\')${escaped_project_parent_baseline_name}\\/${escaped_libName}(\\"|\\')`;
            const regex = new RegExp(regexSource, 'g');
            if (modType === 'custom/lib') {
              input = replace(input, regex, `'${project.parent.baseline.name}/${libName}/${sourceFolder}'`);
            }
            if (modType === 'lib') {
              if (libName !== project.name) {
                input = replace(input, regex, `'${libName}/${sourceFolder}'`);
              }
            }
          }

          (() => {
            const regexSource = `(\\"|\\')${escaped_libName}(\\"|\\')`;
            const regex = new RegExp(regexSource, 'g');
            // asyncCall && regex.test(input) && console.log('2')
            input = replace(input, regex, `'${libName}/${sourceFolder}'`);
          })();

          (() => {
            const regexSource = `(\\"|\\')${escaped_libName}\\/(${escaped_folders.join('|')})`;
            const regex = new RegExp(regexSource, 'g');
            // asyncCall && regex.test(input) && console.log('3')
            input = replace(input, regex, `'${libName}/${sourceFolder}`);
          })();

          if (project.isSite && project.isWorkspaceChildProject) {
            const regexSource = `(\\"|\\')${escaped_project_parent_baseline_name}\\/${escaped_libName}\\/(${escaped_folders.join('|')})`;
            const regex = new RegExp(regexSource, 'g');
            if (modType === 'custom/lib') {
              input = replace(input, regex, `'${project.parent.baseline.name}/${libName}/${sourceFolder}`);
            }
            if (modType === 'lib') {
              if (libName !== project.name) {
                input = replace(input, regex, `'${libName}/${sourceFolder}`);
              }
            }
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
        const escaped_projectParentBaselineName = project.isSite && escapeStringForRegEx(project.parent.baseline.name);

        // TODO ommit import|export|requires when checking this

        project.parent.childrenThatAreClients
          .forEach((child) => {
            const clientName = child.name;
            const escaped_clientName = escapeStringForRegEx(clientName);
            (() => {
              const regex = `(\\"|\\')${escaped_clientName}\\/(${config.folder.src})`;
              const matches = input.match(new RegExp(regex, 'g'));
              if (_.isArray(matches)) {
                matches.forEach(m => {
                  warn(`Please don't use client "${clientName}" inside source code of lib "${project.genericName}":
               files: ${relativePath}
              ...
              ${m}
              ...
               `)
                });
              }
            })()


            if (project.isSite && project.isWorkspaceChildProject && child.name !== project.name) {
              const regex = `(\\"|\\')${escaped_projectParentBaselineName}\\/${escaped_clientName}\\/(${config.folder.src})`;
              const matches = input.match(new RegExp(regex, 'g'));
              if (_.isArray(matches)) {
                matches.forEach(m => {
                  warn(`Please don't use baseline client "${clientName}" inside source code of lib "${project.genericName}":
               files: ${relativePath}
              ...
              ${m}
              ...
               `)
                });
              }
            }

          });
      })();
      //#endregion

    } else if (modType === 'app' || modType === 'custom/app') {

      /**
       * 'npm-(isomorphic|angular)-lib-name' => 'npm-(isomorphic|angular)-lib-name/browser'
       * 'npm-(isomorphic|angular)-lib-name/(notallowedfolder) => 'npm-(isomorphic|angular)-lib-name/browser'
       */
      //#region 1. Use browser version of npm libs in client
      (() => {
        const escaped_folders = [
          config.folder.dist,
          config.folder.src,
          config.folder.bundle
        ].map(s => escapeStringForRegEx(s));

        project.parent.childrenThatAreThirdPartyInNodeModules.forEach((child) => {
          const libName = child.name;
          const escpaed_libName = escapeStringForRegEx(libName);

          (() => {
            const regexSource = `(\\"|\\')${escpaed_libName}(\\"|\\')`;
            const regex = new RegExp(regexSource, 'g');
            // regex.test(input) && console.log('app1.1')
            input = replace(input, regex, `'${libName}/${config.folder.browser}'`
            );
          })();

          (() => {
            const regexSource = `(\\"|\\')${escpaed_libName}\\/(${escaped_folders.join('|')})`;
            const regex = new RegExp(regexSource, 'g');
            // regex.test(input) && console.log('app1.2')
            input = replace(input, regex, `'${libName}/${config.folder.browser}`);
          })();

        });
      })();
      //#endregion

      /**
       * 'lib-name' => 'lib-nameb/browser-for-client-name'
       * 'lib-name/(not-allowed-folders) => 'lib-name/browser-for-client-name
       * 'lib-name/ => 'lib-name/browser-for-client-name/
       */
      //#region 2. Handle workspace libs names in clients
      (() => {
        const escaped_folders = [
          config.folder.browser,
          config.folder.dist,
          config.folder.module,
          config.folder.bundle,
          config.folder.src,
          config.folder.components,
          ...project.parent.childrenThatAreLibs
            .filter(c => c.name !== project.name)
            .map(c => IncrementalBuildProcessExtended.getBrowserVerPath(c.name))
        ].map(s => escapeStringForRegEx(s));

        const browser_for_project = IncrementalBuildProcessExtended.getBrowserVerPath(project.name);

        project.parent.childrenThatAreLibs.forEach((child) => {
          const libName = child.name;
          const escaped_libName = escapeStringForRegEx(libName);

          (() => {
            const regexSource = `(\\"|\\')${escaped_libName}(\\"|\\')`;
            const regex = new RegExp(regexSource, 'g');
            // regex.test(input) && console.log('app2.2')
            input = replace(input, regex, `'${libName}/${browser_for_project}'`);
          })();

          (() => {
            const regexSource = `(\\"|\\')${escaped_libName}\\/(${escaped_folders.join('|')})(?!\\-)`;
            const regex = new RegExp(regexSource, 'g');
            // regex.test(input) && console.log('app2.4')
            input = replace(input, regex, `'${libName}/${browser_for_project}`);
          })();

          (() => {
            const regexSource = `(\\"|\\')${escaped_libName}\\/(?!(${escaped_folders.join('|')}))`;
            const regex = new RegExp(regexSource, 'g');
            // regex.test(input) && console.log('app2.6')
            input = replace(input, regex, `'${libName}/${browser_for_project}/`);
          })();

        });
      })();
      //#endregion

      /**
       * 'angular-lib-itself-name => 'components
       * 'angular-lib-itself-name/(notallowedfolder)' => 'components'
       * 'angular-lib-itself-name/(notallowedfolder) => 'components
       * 3. In site this is done in baseline-site-join
       */
      //#region 3. Project inself reference in src/ of angular-lib
      if (project.type === 'angular-lib') {

        const notAllowedFor = [
          IncrementalBuildProcessExtended.getBrowserVerPath(project.name),
          ...project.parent.childrenThatAreLibs.map(c => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(c.name)
          }),
          ...project.parent.childrenThatAreClients.map(c => {
            return IncrementalBuildProcessExtended.getBrowserVerPath(c.name)
          }),
          config.folder.browser,
          config.folder.dist,
          config.folder.module,
          config.folder.bundle,
        ].map(s => escapeStringForRegEx(s));

        const escaped_project_name = escapeStringForRegEx(project.name);


        (() => {
          const regexSoureceForNotAllowed = `(\\"|\\')${escaped_project_name}\\/(${notAllowedFor.join('|')})(\\"|\\')`;
          // debugging && console.log('regexSoureceForNotAllowed', regexSoureceForNotAllowed)
          input = replace(input, new RegExp(regexSoureceForNotAllowed, 'g'), `'${config.folder.components}'`);
        })();

        (() => {
          const regexSoureceForNotAllowed = `(\\"|\\')${escaped_project_name}\\/(${notAllowedFor.join('|')})`;
          // debugging && console.log('regexSoureceForNotAllowed', regexSoureceForNotAllowed)
          input = replace(input, new RegExp(regexSoureceForNotAllowed, 'g'), `'${config.folder.components}`);
        })();

        (() => {
          const regexSoureceForNotAllowed = `(\\"|\\')${escaped_project_name}\\/`;
          // debugging && console.log('regexSoureceForNotAllowed', regexSoureceForNotAllowed)
          input = replace(input, new RegExp(regexSoureceForNotAllowed, 'g'), `'${config.folder.components}/`);
        })();

      }
      //#endregion

      /**
       * 'baseline/client-name
       * 'baseline/client-name/(not-allowed-folders)
       * 'client-name
       * 'client-name/(not-allowed-folders)
       */
      //#region hander errors when client code is using client code
      (() => {

        const escaped_folders = [
          config.folder.browser,
          config.folder.dist,
          config.folder.module,
          config.folder.bundle,
          config.folder.src,
          config.folder.components,
        ].map(s => escapeStringForRegEx(s));

        const escaped_project_parent_baseline_name = project.isSite && escapeStringForRegEx(project.parent.baseline.name);

        project.parent.childrenThatAreClients
          .filter(c => !(['isomorphic-lib', 'angular-lib'] as LibType[]).includes(c.type))
          .forEach((child) => {

            const clientName = child.name;
            const escaped_clientName = escapeStringForRegEx(clientName);

            if (project.isSite && project.isWorkspaceChildProject) {
              const regex = `(\\"|\\')${escaped_project_parent_baseline_name}\\/${escaped_clientName}(\\/(${escaped_folders.join('|')}))*`;
              const matches = input.match(new RegExp(regex, 'g'));
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

            (() => {
              const regexSourece = `(\\"|\\')${escaped_clientName}(\\/(${escaped_folders.join('|')}))*`;
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
            })();



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
    super(project.isSite ? void 0 : folderPattern(project), '', project && project.location, project);
  }
  //#endregion

  syncAction(): void {
    //#region SYNC ACTION
    const files = glob.sync(this.foldersPattern, { cwd: this.project.location });
    // console.log(files)
    files.forEach(f => {
      SourceModifier.PreventNotUseOfTsSourceFolders(this.project, f)
    });
    //#endregion
  }

  preAsyncAction(): void {
    // throw new Error("Method not implemented.");
  }

  public lastChangedAsyncFileS: string[] = [];

  asyncAction(filePath: string) {
    const that = this;
    //#region ASYNC ACTION
    // console.log('SOurce modifier async !', filePath)
    const f = filePath.replace(this.project.location, '').replace(/^\//, '');
    if (this.project.sourceFilesToIgnore().includes(f)) {
      return;
    }
    if (this.lastChangedAsyncFileS.includes(filePath)) {
      // console.log('dont perform action on ', filePath)
      return;
    }

    if (fse.existsSync(filePath)) {
      this.lastChangedAsyncFileS.push(filePath);
      log(`[sourcemodifier] File fix: ${f}`)
      SourceModifier.PreventNotUseOfTsSourceFolders(this.project, f, void 0, true);
      ((filePathAA) => {
        setTimeout(() => {
          this.lastChangedAsyncFileS = this.lastChangedAsyncFileS.filter(fileAlread => fileAlread !== filePathAA);
        }, 1000);
      })(filePath);

    }
    //#endregion
  }

}


function folderPattern(project: Project) {
  return `${
    project.isSite ? config.folder.custom : `{${[config.folder.src, config.folder.components].join(',')}}`
    }/**/*.ts`
}
