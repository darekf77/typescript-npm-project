//#region imports
import * as _ from 'lodash';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';
import * as os from 'os';
import { watch } from 'chokidar';
import { config } from '../../config';
import { Project } from '../abstract';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';;
import { BuildOptions, TnpDB } from 'tnp-db';
import { FeatureForProject } from '../abstract';
//#endregion

export class CopyManager extends FeatureForProject {

  private buildOptions: BuildOptions;

  private db: TnpDB;
  //#region init
  public async initCopyingOnBuildFinish(buildOptions: BuildOptions) {
    this.buildOptions = buildOptions;
    const { watch } = buildOptions;

    if (!Array.isArray(this.buildOptions.copyto) || this.buildOptions.copyto.length === 0) {
      if (this.project.isTnp) {
        this.db = await TnpDB.Instance(config.dbLocation);
        Helpers.info(`${chalk.bold(config.frameworkName)} project will be copied` +
          ` to active builds automaticly... `);
      } else {
        Helpers.info(`No need to copying on build finsh... `)
        return;
      }
    }
    if (watch) {
      await this.start(void 0, void 0, watch);
      await this.startAndWatch();
    } else {
      await this.start();
    }
  }
  //#endregion

  //#region start
  private async start(
    event?: Models.other.FileEvent,
    specyficFileRelativePath?: string,
    dontRemoveDestFolder = false
  ) {
    const outDir = this.buildOptions.outDir;
    let projectToCopyTo: Project[] = [];

    if (Array.isArray(this.buildOptions.copyto) && this.buildOptions.copyto.length > 0) {
      projectToCopyTo = this.buildOptions.copyto as Project[];
    } else if (this.project.isTnp) {
      const allBuilds = (await this.db.getBuilds());
      const activeBuilds = allBuilds
        .filter(b => {
          return b.project && (b.project.isWorkspace || b.project.isStandaloneProject);
        })
        .filter(b => (b.project as Project).tnpBundle.projectIsAllowedForInstall)
        .map(b => b.project as Project);
      projectToCopyTo = activeBuilds;
      activeBuilds.forEach(p => {
        Helpers.info(`Update active ${config.frameworkName} build for ${p.genericName} ..`);
      });
      this.buildOptions.copyto = projectToCopyTo;
    }

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

    // Helpers.log(`watching folder for as copy source !! ${monitorDir}`)

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
      console.log(`Waiting for outdir: ${this.buildOptions.outDir}, monitor Dir: ${monitorDir}`);
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
    if (this.project.isContainerWorkspaceRelated || options.forceCopyPackageJSON) {
      var packageJson: Models.npm.IPackageJSON = fse.readJsonSync(path.join(sourceLocation, config.file.package_json), {
        encoding: 'utf8'
      });
      if (this.project.isWorkspace && markAsGenerated) {
        packageJson.tnp.isGenerated = true;
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

    this.executeCopy(sourceLocation, destinationLocation, options);

    if (this.project.isContainerWorkspaceRelated || options.forceCopyPackageJSON) {
      const packageJsonLocation = path.join(destinationLocation, config.file.package_json);
      // console.log(`packageJsonLocation: ${packageJsonLocation}`)
      // console.log('packageJson', packageJson)
      fse.writeJsonSync(packageJsonLocation, packageJson, {
        spaces: 2,
        encoding: 'utf8'
      });
      // console.log(`packageJsonLocation saved: ${packageJsonLocation}`)
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
        dir = `${path.basename(path.dirname(path.dirname(destinationLocation)))}/${dir}`
      }
      Helpers.info(`Source of project "${this.project.genericName})" generated in ${dir}/(< here >) `)
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

  private executeCopy(sourceLocation: string, destinationLocation: string, options: Models.other.GenerateProjectCopyOpt) {
    const { useTempLocation, filterForBundle, ommitSourceCode, override } = options;
    let tempDestination: string;
    // console.log('useTempLocation',useTempLocation)
    if (useTempLocation) {
      tempDestination = `${os.platform() === 'darwin' ? '/private/tmp' : '/tmp'}/${_.camelCase(destinationLocation)}`;
      if (fse.existsSync(tempDestination)) {
        Helpers.remove(tempDestination);
      }

      Helpers.mkdirp(tempDestination);
      // console.log(`tempDestination: "${tempDestination}"`);
      // process.exit(0)
    } else {
      tempDestination = destinationLocation;
    }

    const sourceFolders = [
      config.folder.src,
      config.folder.components,
      config.folder.custom,
    ];

    const foldersToSkip = [
      ...(filterForBundle ? [
        '.vscode',
        ..._.values(config.tempFolders),
      ] : []),
      ...(this.project.projectLinkedFiles().map(c => c.relativePath)),
      ...((filterForBundle && ommitSourceCode) ? sourceFolders : []),
      ...(this.project.isWorkspace ? this.project.children.map(c => c.name) : [])
    ];

    // console.log(foldersToSkip)

    const filter = override ? filterOnlyCopy(sourceFolders, this.project) : filterDontCopy(foldersToSkip, this.project);

    Helpers.copy(`${sourceLocation}/`, tempDestination, { filter });

    if (useTempLocation) {
      Helpers.copy(`${tempDestination}/`, destinationLocation);
      Helpers.remove(tempDestination);
    }

    if (this.project.isContainerWorkspaceRelated) {
      // console.log(`For project: ${this.project.genericName} files:
      // ${this.project.projectSourceFiles()}
      // `)
      this.project.projectSourceFiles().forEach(f => {
        const source = path.join(this.project.location, f);
        if (fse.existsSync(source)) {
          Helpers.log(`Copying file/folder to static build: ${f} `)
          if (fse.lstatSync(source).isDirectory()) {
            Helpers.tryCopyFrom(source, path.join(destinationLocation, f));
          } else {
            Helpers.copyFile(source, path.join(destinationLocation, f));
          }
        } else {
          Helpers.log(`[executeCopy] Doesn not exist source: ${source}`);
        }
      });
    }

  }
  //#endregion

  //#region copy build distribution to
  public copyBuildedDistributionTo(destination: Project,
    options: { specyficFileRelativePath?: string, outDir?: 'dist' | 'bundle' }, dontRemoveDestFolder: boolean) {

    let { specyficFileRelativePath = void 0, outDir = 'dist' } = options || {};

    if (!specyficFileRelativePath && (!destination || !destination.location)) {
      Helpers.warn(`Invalid project: ${destination.name}`)
      return
    }

    const namePackageName = this.project.isTnp ? config.file.tnpBundle : this.project.name;


    if (specyficFileRelativePath) {
      const sourceFile = path.normalize(path.join(this.project.location,
        outDir, specyficFileRelativePath));

      const destinationFile = path.normalize(path.join(destination.location,
        config.folder.node_modules,
        namePackageName,
        specyficFileRelativePath));


      specyficFileRelativePath = specyficFileRelativePath.replace(/^\//, '');

      if (outDir === 'dist' && this.buildOptions.watch) {
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
      } else {
        Helpers.copyFile(sourceFile, destinationFile);
      }
      if (specyficFileRelativePath === config.file.package_json) {
        Helpers.copyFile(sourceFile, path.join(path.dirname(destinationFile), config.folder.browser, path.basename(destinationFile)));
      }
    } else {
      const projectOudDirDest = path.join(destination.location,
        config.folder.node_modules,
        namePackageName
      );

      if (!dontRemoveDestFolder) {
        Helpers.tryRemoveDir(projectOudDirDest, true)
      }

      if (this.project.isTnp) {
        // console.info('[copyto] TNP INTSTALL')
        destination.tnpBundle.installAsPackage()
      } else {
        // console.info('[copyto] NORMAL INTSTALL')
        const monitoredOutDir: string = path.join(this.project.location, outDir)

        Helpers.tryCopyFrom(monitoredOutDir, projectOudDirDest);
        const folderToLink = [
          `tmp-src-${outDir}`,
          this.project.sourceFolder,
        ];
        if (outDir === 'dist' && this.buildOptions.watch) {

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
      }
    }

  }
  //#endregion

}


function filterDontCopy(basePathFoldersTosSkip: string[], project: Project) {

  return (src: string, dest: string) => {
    // console.log('src',src)
    const baseFolder = _.first(src.replace(project.location, '')
      .replace(/^\//, '').split('/'));
    if (!baseFolder || baseFolder.trim() === '') {
      return true;
    }
    const isAllowed = _.isUndefined(basePathFoldersTosSkip.find(f => baseFolder.startsWith(f)));
    return isAllowed;
  };

}

function filterOnlyCopy(basePathFoldersOnlyToInclude: string[], project: Project) {

  return (src: string, dest: string) => {
    const baseFolder = _.first(src.replace(project.location, '')
      .replace(/^\//, '').split('/'));
    if (!baseFolder || baseFolder.trim() === '') {
      return true;
    }
    const isAllowed = !_.isUndefined(basePathFoldersOnlyToInclude.find(f => baseFolder.startsWith(f)));
    return isAllowed;
  };

}
