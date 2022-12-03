import { chokidar, _ } from 'tnp-core';
import { glob } from 'tnp-core';
import { path } from 'tnp-core'
import { fse } from 'tnp-core'
import chalk from 'chalk';
import { FeatureForProject, Project } from '../abstract';
import { ProjectFactory } from '../../scripts/NEW-PROJECT_FILES_MODULES/project-factory.backend';
import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { VscodeProject } from '../abstract/project/vscode-project.backend';

/**
 * DEPRAECATED
 */
export class SingularBuild extends FeatureForProject {

  static getProxyProj(workspaceOrContainer: Project, client: string, outFolder: Models.dev.BuildDir = 'dist') {
    return path.join(workspaceOrContainer.location, outFolder, workspaceOrContainer.name, client);
  }

  watchers: chokidar.FSWatcher[] = [];

  async createSingluarTargeProjFor(parent: Project, client: Project, outFolder: Models.dev.BuildDir, watch = false): Promise<Project> {

    const children = this.project.children
      .filter(c => (c.typeIs('isomorphic-lib')) && c.frameworkVersionAtLeast('v3'))
      ;

    const destProjPath = SingularBuild.getProxyProj(parent, client.name, outFolder); // path.join(parent.location, outFolder, parent.name, client.name);
    Helpers.log(`dist project: ${destProjPath}`);
    Helpers.mkdirp(destProjPath);
    [
      config.file.package_json,
      config.file.package_json__tnp_json5,
      config.file.tnpEnvironment_json,
    ].forEach(fileOrFolder => {
      const source = path.join(client.location, fileOrFolder);
      const dest = path.join(destProjPath, fileOrFolder);
      Helpers.createSymLink(source, dest, { continueWhenExistedFolderDoesntExists: true });
    });

    [
      'app',
      'lib',
      'app.ts',
      'app.html',
      'app.css',
      'app.scss',
    ].forEach(f => {
      const source = path.join(client.location, config.folder.src, f);
      const dest = path.join(destProjPath, config.folder.src, f);
      if (['lib', 'app'].includes(f)) {
        if (!Helpers.exists(source)) {
          Helpers.mkdirp(source);
        }
      }
      if (Helpers.exists(source)) {
        Helpers.createSymLink(source, dest);
      }
    });

    // const libPath = path.join(destProjPath, config.folder.src, 'lib');
    // const appPath = path.join(destProjPath, config.folder.src, 'app');
    // const appTsPath = path.join(destProjPath, config.folder.src, 'app.ts');
    // const appHtmlPath = path.join(destProjPath, config.folder.src, 'app.html');

    // const clientLibPath = path.join(client.location, config.folder.src, 'lib');
    // const clientAppPath = path.join(client.location, config.folder.src, 'app');
    // const clientAppTsPath = path.join(client.location, config.folder.src, 'app.ts');
    // const clientAppHtmlPath = path.join(client.location, config.folder.src, 'app.html');

    // Helpers.createSymLink(clientLibPath, libPath);
    // if (!Helpers.exists(clientAppPath)) {
    //   Helpers.mkdirp(clientAppPath);
    // }
    // Helpers.createSymLink(clientAppPath, appPath);
    // Helpers.createSymLink(clientAppTsPath, appTsPath);
    // Helpers.createSymLink(clientAppHtmlPath, appHtmlPath);

    children.forEach(c => {
      const source_lib = path.join(c.location, config.folder.src, 'lib');
      const source_assets = path.join(c.location, config.folder.src, 'assets');
      const dest_lib = path.join(destProjPath, config.folder.src, 'libs', c.name);
      const dest_assets = path.join(destProjPath, config.folder.src, 'assets', 'assets-for', c.name);
      Helpers.createSymLink(source_lib, dest_lib);

      if(!Helpers.exists(source_assets)) {
        Helpers.mkdirp(source_assets);
      }

      if (watch) {
        // SYNCING FOLDERS
        Helpers.copy(source_assets, dest_assets, { recursive: true, overwrite: true });
        const watcher = chokidar.watch(source_assets, {
          ignoreInitial: true,
          followSymlinks: false,
          ignorePermissionErrors: true,
        }).on('all', (event, f) => {
          const dest = (path.join(dest_assets, Helpers.removeSlashAtBegin(f.replace(`${source_assets}`, ''))))
          if ((event === 'add') || (event === 'change')) {
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
      } else {
        Helpers.copy(source_assets, dest_assets, { recursive: true, overwrite: true });
      }
    });


    let singularWatchProj = Project.From<Project>(destProjPath);
    parent.node_modules.linkToProject(singularWatchProj);
    await singularWatchProj.filesStructure.init(''); // THIS CAUSE NOT NICE SHIT


    VscodeProject.launchFroSmartContaienr(parent);

    // (() => {
    //   const tsconfigPath = path.join(parent.location, config.file.tsconfig_json);
    //   const paths = children.reduce((a, c) => {
    //     return _.merge(a, {
    //       [`@${parent.name}/${c.name}`]: [`./${c.name}/${config.folder.src}/lib`],
    //       [`@${parent.name}/${c.name}/*`]: [`./${c.name}/${config.folder.src}/lib/*`],
    //     });
    //   }, {})

    //   const content = {
    //     "compilerOptions": {
    //       "rootDir": "./",
    //       paths
    //     }
    //   };
    //   Helpers.writeJson(tsconfigPath, content);
    // })();

    // (() => {
    //   const targetSrc = path.join(destProjPath, config.folder.src);
    //   const srcContainerSmart = path.join(parent.location, config.folder.src);
    //   Helpers.createSymLink(targetSrc, srcContainerSmart);
    // })();

    //#region tsconfig pathes are only good for FE (THIS CODE DOESN'T MAKE SENSE)
    // (() => {
    //   const tsconfigPath = path.join(parent.location, config.file.tsconfig_json);
    //   const paths = children.reduce((a, c) => {
    //     return _.merge(a, {
    //       [`@${parent.name}/${c.name}`]: [`./${c.name}/${config.folder.src}/lib`],
    //       [`@${parent.name}/${c.name}/*`]: [`./${c.name}/${config.folder.src}/lib/*`],
    //     });
    //   }, {})

    //   const content = {
    //     "compilerOptions": {
    //       "rootDir": "./",
    //       paths
    //     }
    //   };
    //   Helpers.writeJson(tsconfigPath, content);
    // })();

    // const tsconfigParentBase = path.join(parent.location, 'tsconfig.base.json');

    // (() => {
    //   const tsconfigPath = path.join(singularWatchProj.location, config.file.tsconfig_json);
    //   const content = Helpers.readJson(tsconfigPath);
    //   const paths = children.reduce((a, c) => {
    //     return _.merge(a, {
    //       [`@${parent.name}/${c.name}`]: [`./${config.folder.src}/libs/${c.name}`],
    //       [`@${parent.name}/${c.name}/*`]: [`./${config.folder.src}/libs/${c.name}/*`],
    //     });
    //   }, {})

    //   content.compilerOptions.paths = paths;
    //   Helpers.writeJson(tsconfigPath, content);
    // })();


    // Helpers.writeJson(tsconfigParentBase, contenttsconfig);
    //#endregion

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

    const singularWatchProj = await this.createSingluarTargeProjFor(this.project, client, outDir, watch);

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
    // //   const db = await TnpDB.Instance();
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
