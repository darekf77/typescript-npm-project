import { chokidar, crossPlatformPath, _ } from 'tnp-core';
import { path } from 'tnp-core'
import { FeatureForProject, Project } from '../abstract';
import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { VscodeProject } from '../abstract/project/vscode-project.backend';
import { BrowserCodeCut } from '../compilers/build-isomorphic-lib/code-cut/browser-code-cut.backend';
import { recreateApp } from './inside-structures/structs/inside-struct-helpers';

export class SingularBuild extends FeatureForProject {

  static getProxyProj(workspaceOrContainer: Project, client: string, outFolder: Models.dev.BuildDir = 'dist') {
    return path.join(workspaceOrContainer.location, outFolder, workspaceOrContainer.name, client);
  }

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
    if (nonClient) {

    } else {
      children.forEach(c => {
        const source_lib = crossPlatformPath(path.join(c.location, config.folder.src, 'lib'));
        const dest_lib = crossPlatformPath(path.join(smartContainerTargetProjPath, config.folder.src, 'libs', c.name));
        Helpers.createSymLink(source_lib, dest_lib);
      });
    }

    //#endregion

    //#region symlinks lib => libs
    // children.forEach(c => {
    //   const source_lib = crossPlatformPath(path.join(c.location, config.folder.src, 'app'));
    //   const dest_lib = crossPlatformPath(path.join(smartContainerTargetProjPath, config.folder.src, '_', c.name, 'app '));
    //   Helpers.createSymLink(source_lib, dest_lib);
    // });
    //#endregion

    //#region copy core asset files
    if (nonClient) {

    } else {
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
    }
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

      recreateApp(client);


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
    if (nonClient) {

    } else {
      await singularWatchProj.filesStructure.init(''); // THIS CAUSE NOT NICE SHIT
    }
    // VscodeProject.launchFroSmartContaienr(parent);

    return singularWatchProj;
  }


  async init(watch: boolean, prod: boolean, outDir: Models.dev.BuildDir, args: string, _client?: string | Project) {
    if (this.project.isWorkspace) {
      await this.workspace(watch, prod);
    }
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
    args = Helpers.cliTool.removeArgFromString(args);
    const clientFromArgs = Helpers.removeSlashAtEnd(_.first((args || '').split(' '))) as any;
    let client: Project = children.find(f => f.name === _client || f.name === clientFromArgs);

    const smartContainerBuildTarget = this.project.smartContainerBuildTarget;

    if (!client && smartContainerBuildTarget) {
      client = smartContainerBuildTarget;
    }

    if (!client) {
      if (clientFromArgs) {
        Helpers.error(`${clientFromArgs} hasn't been add into your container`, false, true)
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

    const nonClinetCildren = children.filter(f => f.name !== client?.name) || [];

    const singularWatchProj = await this.createSingluarTargeProjFor({ parent: this.project, client, outFolder: outDir, watch });
    for (let index = 0; index < nonClinetCildren.length; index++) {
      const c = nonClinetCildren[index];
      await this.createSingluarTargeProjFor({ parent: this.project, client: c, outFolder: outDir, watch: false, nonClient: true });
    }

    Helpers.log(`[singular build] init structure ${!!singularWatchProj}`);

  }


  async workspace(watch: boolean, prod: boolean) {

    // Helpers.log(`[singular build]
    // FOP: ${this.project.genericName},
    // TYPE: ${this.project._type},
    // LOCATION: ${this.project.location}
    // `);

    // const children = this.project.children
    //   .filter(c => c.location !== this.project.location)
    //   .filter(c => !c.name.startsWith('tnp'))
    //   .filter(c => (c.typeIs('isomorphic-lib', 'angular-lib')) && c.frameworkVersionAtLeast('v2'))
    //   ;

    // Helpers.log(`[singularbuild] children for build: \n\n${children.map(c => c.name)}\n\n`);

    // const newFactory = ProjectFactory.Instance;
    // const tmpWorkspaceName = this.project.name;
    // const tmpWorkspaceDirpath = path.join(this.project.location, config.folder.dist);
    // const projjjj = path.join(tmpWorkspaceDirpath, tmpWorkspaceName);
    // Helpers.log(`dist project: ${projjjj}`);
    // let singularWatchProj = Project.From<Project>(projjjj);
    // if (!singularWatchProj) {
    //   Helpers.removeFolderIfExists(projjjj);
    //   singularWatchProj = await newFactory.create({
    //     type: 'isomorphic-lib',
    //     name: tmpWorkspaceName,
    //     cwd: tmpWorkspaceDirpath,
    //     basedOn: void 0,
    //     version: this.project._frameworkVersion,
    //     skipInit: true
    //   });
    //   Helpers.log(`[singular build] singularWatchProj: ${singularWatchProj && singularWatchProj.genericName}`);
    //   // console.log('this.this.project.node_modules.path', this.project.node_modules.path)
    //   this.project.node_modules.linkToProject(singularWatchProj);
    // }

    // const singularDistSrc = path.join(singularWatchProj.location, config.folder.src);
    // Helpers.removeFolderIfExists(singularDistSrc);
    // Helpers.mkdirp(singularDistSrc);

    // Helpers.log(`[singular build] init structure`);

    // await singularWatchProj.filesStructure.init('');
    // Helpers.copyFile(
    //   path.join(this.project.location, config.file.tnpEnvironment_json),
    //   path.join(singularWatchProj.location, config.file.tnpEnvironment_json)
    // );

    // singularWatchProj.packageJson.data.tnp.isGenerated = true;
    // singularWatchProj.packageJson.writeToDisc();

    // children.forEach(c => {
    //   const source = (c.typeIs('angular-lib') ? config.folder.components : config.folder.src);
    //   Helpers.createSymLink(
    //     path.join(c.location, source),
    //     path.join(singularDistSrc, c.name));
    // });

    // Helpers.info(`[singular build] symlink creation done`);
    // Helpers.log(`[singular build] singularWatchProjsingularWatchProj` +
    //   `${singularWatchProj.genericName}, type: $this.{singularWatchProj.type}`);

    // await singularWatchProj.buildProcess.startForLib({
    //   watch,
    //   prod,
    //   outDir: 'dist',
    //   staticBuildAllowed: true,
    // }, false);
    // const targets = children
    //   .map(c => c.name);

    // // if (this.project.isContainer) {

    // //   var projectsToUpdate = (await db.getProjects()).map(c => c.project as Project)
    // //     .filter(c => !c.name.startsWith('tnp'))
    // //     .filter(c => !!this.singularWatchProj ? (c.location !== this.singularWatchProj.location) : true)
    // //     .filter(c => c.location !== this.project.location)
    // //     .filter(c => !c.isWorkspaceChildProject);
    // //   Helpers.info(`Statndalone projects to update:` +
    // //     `\n\n${projectsToUpdate.map(c => c.genericName).join('\n')}\n\n`);
    // //   // process.exit(0)
    // // }

    // let projectsToUpdate = [];


    // children.forEach(c => {
    //   if (this.project.typeIs('container')) {
    //     // console.log(`Do something for ${c.genericName}`)
    //     const source = path.join(singularWatchProj.location, config.folder.dist, c.name);
    //     const sourceBrowser = path.join(singularWatchProj.location, config.folder.dist, config.folder.browser, c.name);
    //     const destBrowser = path.join(singularWatchProj.location, config.folder.dist, c.name, config.folder.browser);
    //     Helpers.remove(destBrowser, true);
    //     Helpers.createSymLink(sourceBrowser, destBrowser, { continueWhenExistedFolderDoesntExists: true });

    //     projectsToUpdate.forEach(projForUp => {
    //       const dest = path.join(projForUp.location, config.folder.node_modules, c.name);
    //       Helpers.remove(dest, true);
    //       Helpers.createSymLink(source, dest, { continueWhenExistedFolderDoesntExists: true });
    //       console.log(`LINK: ${source} -> ${dest}`, 1);
    //     });
    //   } else if (this.project.typeIs('workspace')) {
    //     const source = path.join(singularWatchProj.location, config.folder.dist, c.name);
    //     const dest = path.join(c.location, config.folder.dist);
    //     Helpers.remove(dest, true);
    //     Helpers.createSymLink(source, dest, { continueWhenExistedFolderDoesntExists: true });

    //     targets.forEach(targetName => {
    //       const sourceBrowser = path.join(
    //         singularWatchProj.location, config.folder.dist,
    //         `${config.folder.browser}-for-${targetName}`, c.name);

    //       const destBrowser = path.join(c.location, `${config.folder.browser}-for-${targetName}`);
    //       Helpers.remove(destBrowser, true);
    //       Helpers.createSymLink(sourceBrowser, destBrowser, { continueWhenExistedFolderDoesntExists: true });
    //     });
    //   }
    // });
    // if (this.project.isContainer) {
    //   console.info(`All Projects are linked OK... watching...`)
    // }
  }
}
