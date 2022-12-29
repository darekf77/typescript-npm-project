//#region imports
import { chokidar, crossPlatformPath, _ } from 'tnp-core';
import { path } from 'tnp-core'
import { FeatureForProject, Project } from '../abstract';
import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { VscodeProject } from '../abstract/project/vscode-project.backend';
import { BrowserCodeCut } from '../compilers/build-isomorphic-lib/code-cut/browser-code-cut.backend';
import { BuildOptions } from 'tnp-db';
//#endregion

export class SingularBuild extends FeatureForProject {

  static getProxyProj(workspaceOrContainer: Project, client: string, outFolder: Models.dev.BuildDir = 'dist') {
    return path.join(workspaceOrContainer.location, outFolder, workspaceOrContainer.name, client);
  }

  private watchers: chokidar.FSWatcher[] = [];

  async createSingluarTargeProjFor(parent: Project, buildOptions: BuildOptions<Project>): Promise<Project> {

    const { outDir, watch, client, clientArgString } = buildOptions;

    const children = this.project.children
      .filter(c => (c.typeIs('isomorphic-lib')) && c.frameworkVersionAtLeast('v3'))
      ;

    const smartContainerTargetProjPath = SingularBuild.getProxyProj(parent, client.name, outDir); // path.join(parent.location, outFolder, parent.name, client.name);
    Helpers.log(`dist project: ${smartContainerTargetProjPath}`);
    Helpers.mkdirp(smartContainerTargetProjPath);
    const appRelatedFiles = BrowserCodeCut.extAllowedToReplace.map(ext => `app${ext}`);

    //#region symlinks package.json, tmp-environemnt
    (() => {
      [
        config.file.package_json,
        config.file.package_json__tnp_json5,
        config.file.tnpEnvironment_json,
      ].forEach(fileOrFolder => {
        const source = path.join(client.location, fileOrFolder);
        const dest = path.join(smartContainerTargetProjPath, fileOrFolder);
        Helpers.createSymLink(source, dest, { continueWhenExistedFolderDoesntExists: true });
      });
    })();

    //#endregion

    //#region symlinks app/lib
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
      const source_lib = crossPlatformPath(path.join(c.location, config.folder.src, 'lib'));
      const dest_lib = crossPlatformPath(path.join(smartContainerTargetProjPath, config.folder.src, 'libs', c.name));
      Helpers.createSymLink(source_lib, dest_lib);
    });
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

      const sourcesAppAFilesAbsPathes = appRelatedFiles.map(a => {
        return crossPlatformPath(path.join(client.location, config.folder.src, a));
      });

      const copySourcesToDest = () => {
        for (let index = 0; index < sourcesAppAFilesAbsPathes.length; index++) {
          const absFileSource = sourcesAppAFilesAbsPathes[index];
          const relativeAfile = absFileSource.replace(
            `${crossPlatformPath(path.join(client.location, config.folder.src))}/`,
            '',
          );
          if (Helpers.exists(absFileSource)) {
            const dest = crossPlatformPath(path.join(smartContainerTargetProjPath, config.folder.src, relativeAfile));
            Helpers.removeFileIfExists(dest);
            Helpers.copyFile(absFileSource, dest);
          }
        }
      };

      if (watch) {
        copySourcesToDest();
        const watcher = chokidar.watch(sourcesAppAFilesAbsPathes, {
          ignoreInitial: true,
          followSymlinks: false,
          ignorePermissionErrors: true,
        }).on('all', (event, f) => {
          f = crossPlatformPath(f);
          const relativeAfile = f.replace(
            `${crossPlatformPath(path.join(client.location, config.folder.src))}/`,
            '',
          );
          const dest = crossPlatformPath(path.join(smartContainerTargetProjPath, config.folder.src, relativeAfile));

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
        copySourcesToDest();
      }
    })();
    //#endregion

    let singularWatchProj = Project.From<Project>(smartContainerTargetProjPath);
    parent.node_modules.linkToProject(singularWatchProj);
    await singularWatchProj.filesStructure.init(buildOptions); // THIS CAUSE NOT NICE SHIT

    VscodeProject.launchFroSmartContaienr(parent);

    return singularWatchProj;
  }


  async init(buildOptions: BuildOptions<Project>) {

    if (!this.project.isSmartContainer) {
      return;
    }

    const { client, clientArgString } = buildOptions;

    const children = this.project.children
      .filter(c => (c.typeIs('isomorphic-lib')) && c.frameworkVersionAtLeast('v3'))
      ;

    for (let index = 0; index < children.length; index++) {
      const c = children[index];
      await c.filesStructure.init(buildOptions);
    }


    const smartContainerBuildTarget = this.project.smartContainerBuildTarget;


    if (!client) {
      if (clientArgString) {
        Helpers.error(`${clientArgString} hasn't been add into your container`, false, true)
      } else {
        Helpers.error(`

        Please specify client argument.. example:
          ${config.frameworkName} build my-client-name // client needs to be smart container child
          `, false, true);
      }

    }

    Helpers.log(`[singularbuildcontainer] children for build: \n\n${children.map(c => c.name)}\n\n`);

    if (!smartContainerBuildTarget) {
      this.project.packageJson.data.tnp.smartContainerBuildTarget = client.name;
      this.project.packageJson.save('updating smart container target');
    }

    const singularWatchProj = await this.createSingluarTargeProjFor(this.project, buildOptions);

    Helpers.log(`[singular build] init structure ${!!singularWatchProj}`);

  }

}
