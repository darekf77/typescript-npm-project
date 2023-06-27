//#region imports
import { chokidar, crossPlatformPath, _ } from 'tnp-core';
import { path } from 'tnp-core'
import { FeatureForProject, Project } from '../abstract';
import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { VscodeProject } from '../abstract/project/vscode-project.backend';
import { BrowserCodeCut } from '../compilers/build-isomorphic-lib/code-cut/browser-code-cut.backend';
import { appRelatedFiles, argsToClear, extAllowedToReplace } from '../../constants';
//#endregion

export class SingularBuild extends FeatureForProject {

  //#region static / methods / get proxy project location
  static getProxyProj(workspaceOrContainer: Project, client: string, outFolder: Models.dev.BuildDir = 'dist') {
    return crossPlatformPath([workspaceOrContainer.location, outFolder, workspaceOrContainer.name, client]);
  }
  //#endregion

  watchers: chokidar.FSWatcher[] = [];



  async createSingluarTargeProjFor(options: {
    parent: Project, client: Project, outFolder: Models.dev.BuildDir, watch?: boolean; nonClient?: boolean,
  }): Promise<Project> {
    const { parent, client, outFolder, watch = false, nonClient = false } = options;

    const children = this.project.children
      .filter(c => (c.typeIs('isomorphic-lib')) && c.frameworkVersionAtLeast('v3'))
      ;

    const smartContainerTargetProjPath = SingularBuild.getProxyProj(parent, client.name, outFolder); // path.join(parent.location, outFolder, parent.name, client.name);
    Helpers.log(`dist project: ${smartContainerTargetProjPath}`);
    if (!Helpers.exists(smartContainerTargetProjPath)) {
      Helpers.mkdirp(smartContainerTargetProjPath);
    }

    //#region symlinks package.json, tmp-environemnt
    (() => {
      [
        config.file.package_json,
        config.file.package_json__tnp_json5,
        config.file.environment_js,
        config.file.tnpEnvironment_json,
      ].forEach(fileOrFolder => {
        const source = path.join(client.location, fileOrFolder);
        const dest = path.join(smartContainerTargetProjPath, fileOrFolder);
        Helpers.createSymLink(source, dest, { continueWhenExistedFolderDoesntExists: true });
      });
    })();

    //#endregion

    //#region symlinks app/lib fodlers
    (() => {
      [
        'app',
        'lib',
      ].forEach(f => {
        const source = crossPlatformPath(path.join(client.location, config.folder.src, f));
        const dest = crossPlatformPath(path.join(smartContainerTargetProjPath, config.folder.src, f));
        if (!Helpers.exists(source)) {
          Helpers.mkdirp(source);
        }
        Helpers.removeFileIfExists(dest);
        Helpers.createSymLink(source, dest);
      });
    })();
    //#endregion

    //#region symlinks lib => libs

    children.forEach(c => {
      (() => {
        const source_lib = crossPlatformPath(path.join(c.location, config.folder.src, 'lib'));
        const dest_lib = crossPlatformPath(path.join(smartContainerTargetProjPath, config.folder.src, 'libs', c.name));
        Helpers.createSymLink(source_lib, dest_lib);
      })();
      if (!nonClient && c.name !== this.project.smartContainerBuildTarget.name) {
        (() => {
          const source_lib = crossPlatformPath(path.join(c.location, config.folder.src, 'app'));
          const dest_lib = crossPlatformPath(path.join(smartContainerTargetProjPath, config.folder.src, '-', c.name, 'app'));
          Helpers.createSymLink(source_lib, dest_lib, { continueWhenExistedFolderDoesntExists: true });
        })();

        (() => {
          const dest_lib = crossPlatformPath(path.join(smartContainerTargetProjPath, config.folder.src, '-', c.name, 'index.ts'));
          Helpers.writeFile(dest_lib,
            `export * from "./app";
import def from './app';
export default def;
`);
        })();

        (() => {
          const dest_lib = crossPlatformPath(path.join(smartContainerTargetProjPath, `../${c.name}`, outFolder, 'index.js'));
          Helpers.writeFile(dest_lib, `var start = require("./compiled/-/${c.name}/app");
exports.default = start;`);
        })();

        (() => {
          const dest_lib = crossPlatformPath(path.join(smartContainerTargetProjPath, `../${c.name}`, outFolder, 'app.js')); // fix for waiting in run.js
          Helpers.writeFile(dest_lib, `var start = require("./compiled/-/${c.name}/app.js").default;
exports.default = start;`);
        })();
      }
    });


    //#endregion

    //#region symlinks lib => libs
    // children.forEach(c => {
    //   const source_lib = crossPlatformPath(path.join(c.location, config.folder.src, 'app'));
    //   const dest_lib = crossPlatformPath(path.join(smartContainerTargetProjPath, config.folder.src, '_', c.name, 'app '));
    //   Helpers.createSymLink(source_lib, dest_lib);
    // });
    //#endregion

    //#region copy core asset files

    (() => {
      const corepro = Project.by('isomorphic-lib', client._frameworkVersion) as Project;
      const coreAssetsPath = corepro.pathFor('app/src/assets');
      const filesToCopy = Helpers.filesFrom(coreAssetsPath, true);
      for (let index = 0; index < filesToCopy.length; index++) {
        const fileAbsPath = crossPlatformPath(filesToCopy[index]);
        const relativeFilePath = fileAbsPath.replace(`${coreAssetsPath}/`, '');
        const destAbsPath = crossPlatformPath(path.join(smartContainerTargetProjPath, config.folder.src, 'assets', relativeFilePath));
        Helpers.copyFile(fileAbsPath, destAbsPath);
      }
    })();

    //#endregion

    //#region handle assets watch/copy
    children.forEach(c => {
      const source_assets = crossPlatformPath(path.join(c.location, config.folder.src, 'assets'));
      const dest_assets = crossPlatformPath(path.join(smartContainerTargetProjPath, config.folder.src, 'assets', 'assets-for', parent.name + '--' + c.name));

      if (!Helpers.exists(source_assets)) {
        Helpers.mkdirp(source_assets);
      }

      if (watch) {
        // SYNCING FOLDERS
        (() => {

          Helpers.copy(source_assets, dest_assets, { recursive: true, overwrite: true });
          const watcher = chokidar.watch(source_assets, {
            ignoreInitial: true,
            followSymlinks: false,
            ignorePermissionErrors: true,
          }).on('all', (event, f) => {
            f = crossPlatformPath(f);
            const dest = (path.join(dest_assets, Helpers.removeSlashAtBegin(f.replace(`${source_assets}`, ''))))
            if ((event === 'add') || (event === 'change')) {
              Helpers.removeFileIfExists(dest);
              Helpers.copyFile(f, dest);
            }
            if (event === 'addDir') {
              Helpers.copy(f, dest, { recursive: true, overwrite: true });
            }
            if (event === 'unlink') {
              Helpers.removeFileIfExists(dest);
            }
            if (event === 'unlinkDir') {
              Helpers.remove(dest, true);
            }
          })
          this.watchers.push(watcher);
        })();
      } else {
        Helpers.copy(source_assets, dest_assets, { recursive: true, overwrite: true });
      }
    });
    //#endregion

    //#region handle app.* files watch/copy
    (() => {

      const filesToWatch = [];

      const copySourcesToDestNonTarget = () => {
        children.forEach(c => {
          if (!nonClient && c.name !== this.project.smartContainerBuildTarget.name) {
            for (let index = 0; index < appRelatedFiles.length; index++) {
              const appFileName = appRelatedFiles[index];
              const source = crossPlatformPath([c.location, config.folder.src, appFileName]);
              filesToWatch.push(source);
              const dest = crossPlatformPath([smartContainerTargetProjPath, config.folder.src, '-', c.name, appFileName]);
              Helpers.exists(source) && Helpers.copyFile(source, dest);
            }
          }
        });
      };

      const copySourcesToDestTarget = () => {
        for (let index = 0; index < appRelatedFiles.length; index++) {
          const appFileName = appRelatedFiles[index];
          const source = crossPlatformPath(path.join(client.location, config.folder.src, appFileName))
          const relativeAfile = source.replace(`${crossPlatformPath([client.location, config.folder.src])}/`, '',);
          filesToWatch.push(source);
          const dest = crossPlatformPath(path.join(smartContainerTargetProjPath, config.folder.src, relativeAfile));
          Helpers.exists(source) && Helpers.copyFile(source, dest);
        }
      };

      const copyAll = () => {
        copySourcesToDestNonTarget();
        copySourcesToDestTarget();
      };

      if (watch) {
        copyAll();
        const watcher = chokidar.watch(filesToWatch, {
          ignoreInitial: true,
          followSymlinks: false,
          ignorePermissionErrors: true,
        }).on('all', (event, f) => {
          f = crossPlatformPath(f);
          // C:/Users/darek/projects/npm/firedev-projects/firedev-simple-org/main/src/app.ts
          // C:/Users/darek/projects/npm/firedev-projects/firedev-simple-org
          const containerLocaiton = this.project.location;
          const childName = _.first(f.replace(containerLocaiton + '/' , '').split('/'));
          const toReplace = crossPlatformPath([containerLocaiton, childName, config.folder.src,])

          const relative = f.replace(toReplace + '/', '');
          const isTarget = (childName === client.name);

          const dest = isTarget
            ? crossPlatformPath([smartContainerTargetProjPath, config.folder.src, relative])
            : crossPlatformPath([smartContainerTargetProjPath, config.folder.src, '-', childName, relative]);

          // console.log({
          //   f,
          //   containerLocaiton,
          //   toReplace,
          //   childName,
          //   relative,
          //   isTarget,
          //   dest
          // })

          if ((event === 'add') || (event === 'change')) {
            // Helpers.removeFileIfExists(dest);
            Helpers.copyFile(f, dest);
          }
          if (event === 'unlink') {
            Helpers.removeFileIfExists(dest);
          }
        })
        this.watchers.push(watcher);
      } else {
        copyAll();
      }
    })();
    //#endregion

    let singularWatchProj = Project.From<Project>(smartContainerTargetProjPath);
    parent.node_modules.linkToProject(singularWatchProj);

    await singularWatchProj.filesStructure.init(''); // THIS CAUSE NOT NICE SHIT

    VscodeProject.launchFroSmartContaienr(parent);

    return singularWatchProj;
  }


  async init(watch: boolean, prod: boolean, outDir: Models.dev.BuildDir, args: string, _client?: string | Project) {
    if (!this.project.isSmartContainer) {
      return;
    }

    const children = this.project.children
      .filter(c => (c.typeIs('isomorphic-lib')) && c.frameworkVersionAtLeast('v3'))
      ;

    for (let index = 0; index < children.length; index++) {
      const c = children[index];
      await c.filesStructure.init('');
    }
    args = Helpers.cliTool.removeArgFromString(args, argsToClear);

    let smartContainerBuildTarget = this.project.smartContainerBuildTarget;


    if (!smartContainerBuildTarget && children.length > 1) {
      Helpers.logError(`

    Please specify in your configuration:
      ...
        smartContainerBuildTarget: <name of main project>
      ...
          `, false, false);
    }

    Helpers.log(`[singularbuildcontainer] children for build: \n\n${children.map(c => c.name)}\n\n`);


    if (!smartContainerBuildTarget) {
      smartContainerBuildTarget = _.first(children);
      this.project.packageJson.data.tnp.smartContainerBuildTarget = smartContainerBuildTarget.name;
      this.project.packageJson.save('updating smart container target');
    }

    const nonClinetCildren = children.filter(f => f.name !== smartContainerBuildTarget?.name) || [];

    const singularWatchProj = await this.createSingluarTargeProjFor({ parent: this.project, client: smartContainerBuildTarget, outFolder: outDir, watch });
    for (let index = 0; index < nonClinetCildren.length; index++) {
      const c = nonClinetCildren[index];
      await this.createSingluarTargeProjFor({ parent: this.project, client: c, outFolder: outDir, watch: false, nonClient: true });
    }

    Helpers.log(`[singular build] init structure ${!!singularWatchProj}`);

  }

}
