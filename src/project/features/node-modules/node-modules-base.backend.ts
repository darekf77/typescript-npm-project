//#region imports
import { path } from 'tnp-core';
import { fse } from 'tnp-core';
import { _ } from 'tnp-core';
import { glob } from 'tnp-core';
import { CLI } from 'tnp-cli';
import * as TerminalProgressBar from 'progress';

import { config } from 'tnp-config';
import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { FeatureForProject } from '../../abstract';
import {
  dedupePackages, nodeModulesExists, addDependenceis
} from './node-modules-helpers.backend';
import { NodeModulesCore } from './node-modules-core.backend';

//#endregion

export class NodeModulesBase extends NodeModulesCore {



  /**
   * Copy (just linke npm install) all package from
   * source project node_modules to itself
   * @param source project - source of node_modules
   * @param triggerMsg reason to copy packages
   */
  public async copyFrom(source: Project, triggerMsg: string) {

    Helpers.log(`[node_modules] Copy instalation of npm packages from ` +
      `${CLI.chalk.bold(source.genericName)} to ${CLI.chalk.bold(this.project.genericName)} ${triggerMsg}`);

    if (source.smartNodeModules.exists) {
      this.project.node_modules.remove();
      Helpers.mkdirp(this.project.node_modules.path);
      const packagesToLinkOrCopy = [
        ...Helpers.foldersFrom(source.node_modules.path),
        ...Helpers.linksToFoldersFrom(source.node_modules.path,
          // this.project.frameworkVersionAtLeast('v3') // TODO not needed for now
        )
      ];

      Helpers.log(`

      UPDATING node_moduels packages from smart installation ${packagesToLinkOrCopy.length}

      `);

      if (false
        // this.project.frameworkVersionAtLeast('v3')
      ) {
        //#region copy / link process
        // const allowedAsFolder = [
        //   ...config.packagesThat.needToBeCopiedInstedLink,
        //   ...source.isomorphicPackages,
        // ];
        // //#endregion

        // packagesToLinkOrCopy
        //   .filter(f => path.basename(f) !== this.project.name) // TODO check this fix for weird things with /browser
        //   .forEach(f => {
        //     const basename = path.basename(f);

        //     const needsCopy = !_.isUndefined(allowedAsFolder.find(p => {
        //       if (p.endsWith('*')) {
        //         return basename.startsWith(p.replace('*', ''));
        //       } else {
        //         return p === basename;
        //       }
        //     }));

        //     const dest = path.join(this.project.node_modules.path, path.basename(f));
        //     if (needsCopy) {  //// TODO UNCOMMENT angular-lib v3 smart install
        //       const realFileOrFolderPath = Helpers.isLink(f) ? fse.realpathSync(f) : f;
        //       if (Helpers.exists(realFileOrFolderPath)) {
        //         if (Helpers.isFile(realFileOrFolderPath)) {
        //           Helpers.copyFile(realFileOrFolderPath, dest);
        //         }
        //         if (Helpers.isFolder(realFileOrFolderPath)) {
        //           Helpers.removeFolderIfExists(dest);
        //           Helpers.copy(realFileOrFolderPath, dest, {
        //             asSeparatedFiles: true,
        //             asSeparatedFilesSymlinkAsFile: false,
        //             // copySymlinksAsFiles: (basename !== '.bin'),
        //           });
        //         }
        //       } else {
        //         Helpers.warn(`[${config.frameworkName}] [node-modules-base] not existed real link from bin `
        //           + `${path.basename(f)}`, false);
        //       }
        //     } else {
        //       if (process.platform === 'win32') {
        //         // TODO QUICK_FIX on windows you can't create link to link
        //         Helpers.createSymLink(fse.realpathSync(f), dest, { speedUpProcess: true });
        //       } else {
        //         Helpers.createSymLink(f, dest, { speedUpProcess: true });
        //       }
        //     }
        //   });
      } else {

        packagesToLinkOrCopy
          .filter(f => path.basename(f) !== this.project.name) // TODO check this fix for weird things with /browser
          .forEach(f => {
            const dest = path.join(this.project.node_modules.path, path.basename(f));
            if (path.basename(f) === '.bin') {
              const linkFromBin = fse.realpathSync(f);
              if (Helpers.exists(linkFromBin)) {
                if (Helpers.isFile(linkFromBin)) {
                  Helpers.copyFile(linkFromBin, dest);
                }
                if (Helpers.isFolder(linkFromBin)) {
                  Helpers.removeFolderIfExists(dest);
                  // Helpers.copy(linkFromBin, dest, {
                  //   errorOnExist: false,
                  //   filter: (f) => {
                  //     return
                  //   }
                  // });
                  // try {
                  //   Helpers.copy(linkFromBin)
                  // } catch (error) {

                  // }
                  const all = Helpers.filesFrom(linkFromBin);
                  all.forEach(f => {
                    Helpers.removeFileIfExists(path.join(dest, path.basename(f)));
                    if (Helpers.exists(f, false)) {
                      f = fse.realpathSync(f);
                      // const file = Helpers.readFile(f);
                      // file.replace( new RegExp(),`require('../${path.basename(f)}/lib` )
                      // `require('../lib`
                      Helpers.createSymLink(f, path.join(dest, path.basename(f)));
                    } else {
                      Helpers.warn(`[${config.frameworkName}] [node-modules-base] not existed file from bin `
                        + `${path.basename(f)}`, false);
                    }
                  });
                }
              } else {
                Helpers.warn(`[${config.frameworkName}] [node-modules-base] not existed real link from bin `
                  + `${path.basename(f)}`, false);
              }
            } else {
              if (process.platform === 'win32') {
                // TODO QUICK_FIX on windows you can't create link to link
                Helpers.createSymLink(fse.realpathSync(f), dest, { speedUpProcess: true });
              } else {
                Helpers.createSymLink(f, dest, { speedUpProcess: true });
              }
            }
          });
      }


      return;
    }



    source.packageJson.save(`instalation of packages from ${this.project.genericName} ${triggerMsg} `);


    // global.spinner.start()

    for (let index = 0; index < Models.npm.ArrNpmDependencyType.length; index++) {
      const depName = Models.npm.ArrNpmDependencyType[index];
      const deppp = source.getDepsAsProject(depName);
      for (let index2 = 0; index2 < deppp.length; index2++) {
        const dep = deppp[index2];
        await source.node_modules.copy(dep.name).to(this.project);
      }

    }

    source.node_modules.copyBin.to(this.project);
    // global.spinner.start()

    // const overridedDeps = this.project.getDepsAsPackage('tnp_overrided_dependencies');
    // for (let indexOverridedDeps = 0; indexOverridedDeps < overridedDeps.length; indexOverridedDeps++) {
    //   const d = overridedDeps[indexOverridedDeps];
    //   await this.project.npmPackages.install(triggerMsg, d);
    // }

    this.project.node_modules.dedupe();
    // this.project.node_modules.stuberizeFrontendPackages();
  }

  private get copyBin() {
    const self = this;
    return {
      to(destinationProject: Project, linkOnly = false) {
        const source = path.join(self.project.location, config.folder.node_modules, config.folder._bin);
        const dest = path.join(destinationProject.location, config.folder.node_modules, config.folder._bin);
        if (fse.existsSync(source)) {
          if (linkOnly) {
            Helpers.createSymLink(source, dest);
          } else {
            Helpers.copy(source, dest);
          }
        }
      }
    };
  }

  /**
   *  copy package to project
   * @param pkg
   * @param options
   */
  public copy(pkg: string | Models.npm.Package, options?: { override?: boolean; linkOnly?: boolean; }) {
    const self = this;
    return {
      async to(destination: Project) {

        const { override = false, linkOnly = false } = options || {};

        const packageName = (_.isObject(pkg) ? (pkg as Models.npm.Package).name : pkg) as string;
        let projToCopy = Project.From<Project>(path.join(self.project.location, config.folder.node_modules, packageName));
        const nodeModeulesPath = path.join(destination.location, config.folder.node_modules);
        if (!fse.existsSync(nodeModeulesPath)) {
          Helpers.mkdirp(nodeModeulesPath);
        }

        const pDestPath = path.join(nodeModeulesPath, projToCopy.name);

        if (linkOnly) {
          projToCopy.linkTo(pDestPath);
        } else {
          const addedSuccess = projToCopy.copyManager.generateSourceCopyIn(pDestPath,
            { override, filterForBundle: false, showInfo: false });
          if (!addedSuccess) {
            return;
          }
        }

        const orghideInfos = global.hideInfos;
        global.hideInfos = true;
        const orghideWarnings = global.hideWarnings;
        global.hideWarnings = true;
        const orghideLog = global.hideLog;
        global.hideLog = true;
        const depsNames = addDependenceis(self.project, self.project.location);
        global.hideInfos = orghideInfos;
        global.hideWarnings = orghideWarnings;
        global.hideLog = orghideLog;
        const prog = new TerminalProgressBar('Please wait: :current / :total', depsNames.length);
        depsNames
          // .filter(dep => dep !== self.project.name)
          .forEach(pkgName => {
            const pDestPathPackage = path.join(nodeModeulesPath, pkgName);
            projToCopy = Project.From<Project>(path.join(self.project.location, config.folder.node_modules, pkgName));
            if (projToCopy) {
              if (linkOnly) {
                projToCopy.linkTo(pDestPathPackage);
              } else {
                projToCopy.copyManager.generateSourceCopyIn(pDestPathPackage,
                  { override, filterForBundle: false, showInfo: false });
              }

            } else {
              Helpers.warn(`This is not a npm package: '${pkgName}' inside "${self.project.location}"`);
            }
            prog.tick();
          });
        prog.terminate();

      }
    };
  }
}
