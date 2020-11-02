//#region imports
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';
import * as os from 'os';
import { watch } from 'chokidar';
import { config } from 'tnp-config';
import { Project } from '../../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';;
import { BuildOptions, TnpDB } from 'tnp-db';
import { FeatureForProject } from '../../abstract';
import { CopyMangerHelpers } from './copy-manager-helpers.backend';
//#endregion

export class CopyManager extends FeatureForProject {

  private buildOptions: BuildOptions;
  //#region init
  private modifyPackageFile: { fileRelativePath: string; modifyFn: (d: any) => any }[];
  private renameDestinationFolder?: string;
  public async initCopyingOnBuildFinish(buildOptions: BuildOptions,
    modifyPackageFile?: { fileRelativePath: string; modifyFn: (d: any) => any }[],
    renameDestinationFolder?: string,
  ) {
    this.modifyPackageFile = modifyPackageFile;
    this.renameDestinationFolder = renameDestinationFolder;
    this.buildOptions = buildOptions;
    const { watch } = buildOptions;

    if (!Array.isArray(this.buildOptions.copyto)) {
      this.buildOptions.copyto = [];
    }

    if (this.buildOptions.copyto.length === 0) {
      Helpers.info(`No need to copying on build finsh... `)
      return;
    }
    if (watch) {
      await this.start(void 0, void 0, watch);
      await this.startAndWatch();
      const db = await TnpDB.Instance();

      const updateFromDbLastCommand = (channel: string) => async () => {
        Helpers.log(`Trigger of updateFromDbLastCommand`);
        const db = await TnpDB.Instance();
        const cmd = (await db.getCommands()).find(c => c.isBuildCommand && c.location === Project.Current.location);
        if (cmd) {
          const b = await BuildOptions.from(cmd.command, Project.Current);
          Helpers.info(`

          COPYTO UPDATED: "${channel}"

          from: ${(this.buildOptions.copyto as Project[]).map(c => c.name).join(', ')}

          to: ${(b.copyto as Project[]).map(c => c.name).join(', ')}

      `)
          this.buildOptions.copyto = Helpers.arrays.uniqArray<Project>(b.copyto, 'location');
          await db.updateCommandBuildOptions(cmd.location, this.buildOptions);
        }
      }

      db.listenToChannel(this.project, 'tnp-copyto-add', async () => {
        Helpers.log(`[copytomanager] realtime update add`);
        await updateFromDbLastCommand('tnp-copyto-add')();
      });

      db.listenToChannel(this.project, 'tnp-copyto-remove', async () => {
        Helpers.log(`[copytomanager] realtime update remove`);
        await updateFromDbLastCommand('tnp-copyto-remove')();
      });

    } else {
      await this.start();
    }

  }
  //#endregion

  //#region start
  get projectToCopyTo() {
    if (Array.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0) {
      return this.buildOptions.copyto as Project[];
    }
    return [];
  }
  private async start(
    event?: Models.other.FileEvent,
    specyficFileRelativePath?: string,
    dontRemoveDestFolder = false
  ) {
    const outDir = this.buildOptions.outDir;


    const projectToCopyTo = this.projectToCopyTo;

    for (let index = 0; index < projectToCopyTo.length; index++) {
      const p = projectToCopyTo[index];
      this.copyBuildedDistributionTo(p,
        {
          specyficFileRelativePath: event && specyficFileRelativePath,
          outDir: outDir as any
        },
        dontRemoveDestFolder
      );
    }

  }
  //#endregion

  //#region start and watch
  private startAndWatch() {
    const monitorDir = path.join(this.project.location, this.buildOptions.outDir);

    // Helpers.log(`watching folder for as copy source!! ${ monitorDir } `)

    if (fse.existsSync(monitorDir)) {
      watch(monitorDir, {
        followSymlinks: false
      }).on('change', (f) => {
        if (_.isString(f)) {
          f = f.replace(monitorDir, '') as any
          // console.log(f)
        }
        this.start('changed', f as any);
      }).on('add', f => {
        if (_.isString(f)) {
          f = f.replace(monitorDir, '') as any
          // console.log(f)
        }
        this.start('created', f as any);
      }).on('unlink', f => {
        if (_.isString(f)) {
          f = f.replace(monitorDir, '') as any
          // console.log(f)
        }
        this.start('removed', f as any);
      })

    } else {
      console.log(`Waiting for outdir: ${this.buildOptions.outDir}, monitor Dir: ${monitorDir} `);
      setTimeout(() => {
        this.startAndWatch();
      }, 1000);
    }
  }
  //#endregion

  //#region generate source copy in
  public generateSourceCopyIn(destinationLocation: string,
    options?: Models.other.GenerateProjectCopyOpt): boolean {
    // if (this.project.isWorkspace) {
    //   console.log('GENERATING WORKSPACE')
    // }

    if (_.isUndefined(options)) {
      options = {} as any;
    }
    if (_.isUndefined(options.filterForBundle)) {
      options.filterForBundle = true;
    }
    if (_.isUndefined(options.forceCopyPackageJSON)) {
      options.forceCopyPackageJSON = false;
    }
    if (_.isUndefined(options.ommitSourceCode)) {
      options.ommitSourceCode = false;
    }
    if (_.isUndefined(options.override)) {
      options.override = true;
    }
    if (_.isUndefined(options.showInfo)) {
      options.showInfo = true;
    }
    if (_.isUndefined(options.regenerateProjectChilds)) {
      options.regenerateProjectChilds = false;
    }
    if (_.isUndefined(options.useTempLocation)) {
      options.useTempLocation = true;
    }
    if (_.isUndefined(options.markAsGenerated)) {
      options.markAsGenerated = true;
    }
    if (_.isUndefined(options.regenerateOnlyCoreProjects)) {
      options.regenerateOnlyCoreProjects = true;
    }

    const { override, showInfo, markAsGenerated } = options;

    const sourceLocation = this.project.location;
    var packageJson: Models.npm.IPackageJSON = fse.readJsonSync(path.join(sourceLocation, config.file.package_json), {
      encoding: 'utf8'
    });
    if (markAsGenerated && packageJson && packageJson.tnp) {
      packageJson.tnp.isGenerated = true;
    }
    if (this.project.isContainerWorkspaceRelated || options.forceCopyPackageJSON) {
      if (this.project.isWorkspace && markAsGenerated) {
        packageJson.tnp.isCoreProject = false;
      }
    }

    if (fse.existsSync(destinationLocation)) {
      if (override) {
        Helpers.tryRemoveDir(destinationLocation);
        Helpers.mkdirp(destinationLocation);
      } else {
        if (showInfo) {
          Helpers.warn(`Destination for project "${this.project.name}" already exists, only: source copy`);
        };
      }
    }

    CopyMangerHelpers.executeCopy(sourceLocation, destinationLocation, options, this.project);

    if (this.project.isContainerWorkspaceRelated || options.forceCopyPackageJSON) {
      const packageJsonLocation = path.join(destinationLocation, config.file.package_json);
      // console.log(`packageJsonLocation: ${ packageJsonLocation } `)
      // console.log('packageJson', packageJson)
      fse.writeJsonSync(packageJsonLocation, packageJson, {
        spaces: 2,
        encoding: 'utf8'
      });
      // console.log(`packageJsonLocation saved: ${ packageJsonLocation } `)
    }
    if (this.project.isWorkspace) {
      if (options.markAsGenerated) {
        Helpers.writeFile(path.resolve(path.join(destinationLocation, '../info.txt')), `
      This workspace is generated.
      `);
      } else {
        Helpers.writeFile(path.resolve(path.join(destinationLocation, '../info.txt')), `
      This is container for workspaces.
      `);
      }
    }

    if (showInfo) {
      let dir = path.basename(path.dirname(destinationLocation));
      if (fse.existsSync(path.dirname(path.dirname(destinationLocation)))) {
        dir = `${path.basename(path.dirname(path.dirname(destinationLocation)))} / ${dir} `
      }
      Helpers.info(`Source of project "${this.project.genericName}" generated in ${dir} /(< here >) `)
    }


    if (options.regenerateProjectChilds && this.project.isContainerWorkspaceRelated) {
      let childs = this.project.children;

      if (options.regenerateOnlyCoreProjects) {
        if (this.project.isCoreProject) {
          if (this.project.isContainer) {
            childs = this.project.children.filter(c => c.name === 'workspace');
          }

          if (this.project.isWorkspace) {
            childs = this.project.children.filter(c => config.projectTypes.forNpmLibs.includes(c.name as any));
          }
        } else {
          childs = [];
        }
      }

      childs.forEach(c => {
        // console.log('GENERATING CHILD ' + c.genericName)
        c.copyManager.generateSourceCopyIn(path.join(destinationLocation, c.name), options);
      });
    }

    return true;
  }
  //#endregion

  //#region copy build distribution to
  public copyBuildedDistributionTo(
    destination: Project,
    options: {
      specyficFileRelativePath?: string,
      outDir?: 'dist'
    },
    dontRemoveDestFolder: boolean
  ) {

    let { specyficFileRelativePath = void 0, outDir = 'dist' } = options || {};

    if (!specyficFileRelativePath && (!destination || !destination.location)) {
      Helpers.warn(`Invalid project: ${destination.name}`)
      return
    }

    const namePackageName = (
      (_.isString(this.renameDestinationFolder) && this.renameDestinationFolder !== '') ?
        this.renameDestinationFolder
        : this.project.name
    );

    const folderToLink = [
      `tmp-src-${outDir}`,
      this.project.sourceFolder,
    ];

    const isSourceMapsDistBuild = (outDir === 'dist' && this.buildOptions?.watch);
    const allFolderLinksExists = !isSourceMapsDistBuild ? true : _.isUndefined(folderToLink.find(sourceFolder => {
      const projectOudDirDest = path.join(destination.location,
        config.folder.node_modules,
        namePackageName,
        sourceFolder
      );
      return !Helpers.exists(projectOudDirDest);
    }));


    if (specyficFileRelativePath && allFolderLinksExists) {
      //#region handle single file
      const sourceFile = path.normalize(path.join(this.project.location,
        outDir, specyficFileRelativePath));

      const destinationFile = path.normalize(path.join(destination.location,
        config.folder.node_modules,
        namePackageName,
        specyficFileRelativePath));


      specyficFileRelativePath = specyficFileRelativePath.replace(/^\//, '');

      if (isSourceMapsDistBuild) {
        //#region handle dist copyto with source maps
        if (destinationFile.endsWith('.js.map')) {
          const folderToLink = [
            `tmp-src-${outDir}`,
            this.project.sourceFolder,
          ];
          let content = Helpers.readFile(sourceFile);
          folderToLink.forEach(sourceFolder => {
            content = content.replace(`"../${sourceFolder}`, `"./${sourceFolder}`);
            content = content.replace(`../${sourceFolder}`, sourceFolder);
          });
          Helpers.writeFile(destinationFile, content);
        } else if (specyficFileRelativePath !== config.file.index_d_ts) { // don't override index.d.ts
          Helpers.copyFile(sourceFile, destinationFile);
        }
        //#endregion
      } else {
        Helpers.copyFile(sourceFile, destinationFile);
      }

      //#region copy package json to browser folder
      if (specyficFileRelativePath === config.file.package_json) {

        Helpers.copyFile(sourceFile, path.join(path.dirname(destinationFile), config.folder.browser, path.basename(destinationFile)));
      }
      //#endregion

      //#endregion
    } else {
      //#region handle whole folder at begin
      const projectOudDirDest = path.join(destination.location,
        config.folder.node_modules,
        namePackageName
      );

      if (!dontRemoveDestFolder) {
        Helpers.tryRemoveDir(projectOudDirDest, true)
      }

      // console.info('[copyto] NORMAL INTSTALL')
      const monitoredOutDir: string = path.join(this.project.location, outDir)

      Helpers.tryCopyFrom(monitoredOutDir, projectOudDirDest);

      if (isSourceMapsDistBuild) {

        folderToLink.forEach(sourceFolder => {
          const srcOrComponents = path.join(this.project.location, sourceFolder);
          const projectOudDirDest = path.join(destination.location,
            config.folder.node_modules,
            namePackageName,
            sourceFolder
          );
          Helpers.removeIfExists(projectOudDirDest);
          Helpers.createSymLink(srcOrComponents, projectOudDirDest);
        });

        Helpers.writeFile(path.join(destination.location,
          config.folder.node_modules,
          namePackageName,
          config.file.index_d_ts,
        ), `export * from './${this.project.sourceFolder}';\n`);

        glob.sync(`${path.join(destination.location, config.folder.node_modules, namePackageName)}/${config.folder.browser}/**/*.js.map`)
          .forEach(f => {
            const sourceFolder = `tmp-src-${outDir}`;
            let content = Helpers.readFile(f);
            content = content.replace(`../${sourceFolder}`, sourceFolder);
            Helpers.writeFile(f, content);
          });

        if (this.project.typeIsNot('angular-lib')) {
          glob.sync(`${path.join(destination.location, config.folder.node_modules, namePackageName)}/**/*.js.map`, { ignore: [`${config.folder.browser}/**/*.*`] })
            .forEach(f => {
              const sourceFolder = this.project.sourceFolder;
              let content = Helpers.readFile(f);
              content = content.replace(`"../${sourceFolder}`, `"./${sourceFolder}`);
              content = content.replace(`../${sourceFolder}`, sourceFolder);
              Helpers.writeFile(f, content);
            });
        }

      } else {
        folderToLink.forEach(sourceFolder => {
          const projectOudDirDest = path.join(destination.location,
            config.folder.node_modules,
            namePackageName,
            sourceFolder
          );
          Helpers.removeIfExists(projectOudDirDest);
        });
      }
      const projectOudBorwserSrc = path.join(destination.location,
        config.folder.node_modules,
        namePackageName,
        config.file.package_json
      );
      const projectOudBorwserDest = path.join(destination.location,
        config.folder.node_modules,
        namePackageName,
        config.folder.browser,
        config.file.package_json
      );
      Helpers.copyFile(projectOudBorwserSrc, projectOudBorwserDest);
      //#endregion
    }

  }
  //#endregion

}
