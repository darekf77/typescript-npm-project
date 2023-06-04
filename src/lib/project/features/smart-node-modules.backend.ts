import { crossPlatformPath, _ } from 'tnp-core';
import { path } from 'tnp-core'
import chalk from 'chalk';
import { FeatureForProject, Project } from '../abstract';
import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { CLI } from 'tnp-cli';

export type OverridePacakge = { [name: string]: string | null; };
export type PackageType = Pick<Models.npm.Package, 'name' | 'version'>;

export class SmartNodeModules extends FeatureForProject {
  updateFromReleaseBundle(destination: Project) {
    const source = crossPlatformPath([
      destination.location,
      'tmp-bundle-release',
      'bundle',
      'project',
      destination.name,
      `tmp-local-copyto-proj-${config.folder.bundle}/${config.folder.node_modules}/${destination.name}`,
    ]);

    if (destination.npmPackages.useSmartInstall) {
      (() => {
        const dest = path.join(this.project.node_modules.path, destination.name);
        Helpers.removeIfExists(dest);
        Helpers.copy(source, dest, {
          copySymlinksAsFiles: true,
          omitFolders: [config.folder.node_modules],
          omitFoldersBaseFolder: source
        });
      })();

      (() => {
        const dest = path.join(this.project.smartNodeModules.path, destination.name);
        Helpers.removeIfExists(dest);
        Helpers.copy(source, dest, {
          copySymlinksAsFiles: true,
          omitFolders: [config.folder.node_modules],
          omitFoldersBaseFolder: source
        });
      })();
    } else {
      (() => {
        const dest = path.join(this.project.node_modules.path, destination.name);
        Helpers.removeIfExists(dest);
        Helpers.copy(source, dest, {
          copySymlinksAsFiles: true,
          omitFolders: [config.folder.node_modules],
          omitFoldersBaseFolder: source
        });
      })();
    }


  }
  private static _prepared = {};

  public remove = () => {
    Helpers.info(`Removing smart node_modules from ${this.project?.name}`);
    Helpers.remove(this.path)
  };

  //#region getters/private methods

  //#region project from smart node_modules package
  private getAndCreateTempProjForPackage(p: PackageType): Project {
    const dest = this.project.smartNodeModules.pathFor(p.name);
    const pj = path.join(
      path.dirname(this.project.smartNodeModules.pathFor(p.name)),
      config.file.package_json,
    );
    Helpers.removeIfExists(path.dirname(dest))
    Helpers.mkdirp(path.dirname(dest));
    Helpers.writeFile(pj, {
      name: path.basename(path.dirname(dest)),
      dependencies: { [p.name]: p.version }
    });
    return Project.From(path.dirname(this.project.smartNodeModules.pathFor(p.name)))
  }
  //#endregion

  //#region container core project for this project
  private get containerCore() {
    Helpers.taskStarted('Preparing cointainer core ...', true)
    const frameworkVersion = this.project._frameworkVersion;
    const container = Project.by('container', frameworkVersion) as Project;
    if (this.project.location === container?.location) {
      Helpers.log(`Smart node modules instalation for container core..`)
    }
    if (!SmartNodeModules._prepared[container.location]) {
      prepareContainerProject(container, this.project);
    }
    SmartNodeModules._prepared[container.location] = container;
    Helpers.taskDone('Preparing cointainer core ... done', true)
    return container;
  }
  //#endregion

  //#region path
  /**
   * path for smart node_modules for whole project
   */
  public get path() {
    return this.pathFor(this.project.name);
  }
  //#endregion

  //#region resolve smart node_module path
  private pathFor(packageName?: string) { // TOOD THIS IS CONFUSING
    if (!packageName) {
      packageName = this.project.name;
    }
    return crossPlatformPath(path.join(
      this.project.location,
      `${config.folder.tmp}-smart-${config.folder.node_modules}`,
      `for`,
      packageName,
      config.folder.node_modules,
    ));
  }
  //#endregion

  setToSmartContainer() {
    this.project.packageJson.data.tnp.type = 'container';
    this.project.packageJson.data.tnp.smart = true;
    this.project.packageJson.save('setting container as smart')
  }

  //#region smart node_modules exists for whole project
  public get exists() {
    return Helpers.exists(this.path);
  }
  //#endregion

  //#region packages to override after smart node_modules instalation
  private get toOverride(): OverridePacakge {
    const depsToOverride = (this.project.packageJson.data?.tnp?.overrided?.dependencies || {});
    const keys = Object.keys(depsToOverride);
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      if (key.startsWith('-')) {
        Helpers.error(`[${config.frameworkName}] Incorrect dependency to override "${chalk.bold(key)}@${depsToOverride[key]}"`, false, true);
      }
    }
    return depsToOverride;
  }

  private handlePackagesOverride() {
    const toOverride = this.toOverride;

    const mainSmartNodeModulesFolder = path.dirname(path.dirname(this.project.smartNodeModules.path));
    Helpers.foldersFrom(mainSmartNodeModulesFolder)
      .filter(f => path.basename(f) !== this.project.name)
      .forEach(f => {
        if (path.dirname(f).startsWith('@')) {
          const orgPackage = `@${crossPlatformPath([path.basename(path.dirname(f)), path.basename(f)])}`;
          const additonalFolderToRemove = path.join(this.project.smartNodeModules.pathFor(orgPackage))
          Helpers.removeFolderIfExists(additonalFolderToRemove);
        } else {
          const additonalFolderToRemove = path.join(this.project.smartNodeModules.pathFor(path.basename(f)))
          Helpers.removeFolderIfExists(additonalFolderToRemove);
        }
      });

    // Helpers.log('OVERRRIDE' + _.keys(toOverride).join('/'))
    _.keys(toOverride).map(packageName => {

      //#region excepion for local firedev

      const packageVersion = toOverride[packageName];
      if (packageVersion === null) {
        this.project.node_modules.remove(packageName);
      } else {
        //#region dedupe from temp before adding to actual node_modules
        const tempProj = this.project.smartNodeModules.getAndCreateTempProjForPackage({
          name: packageName,
          version: packageVersion
        });
        tempProj.npmPackages.installFromArgs('');
        const Tnp = (Project.Tnp as Project);
        const toDedupe = Tnp.packageJson.data.tnp.core.dependencies.dedupe;
        toDedupe
          .filter(dedupePkgName => {
            // Helpers.log(`dedupePkgName: ${dedupePkgName}`)
            return _.isString(dedupePkgName) && !_.keys(toOverride).includes(dedupePkgName)
          })
          .forEach(dedupePkgName => {
            const existedVersionInMainNodeModules = this.project.npmPackages.package(dedupePkgName).version;
            if (
              tempProj.npmPackages.package(dedupePkgName).exists &&
              tempProj.npmPackages.package(dedupePkgName).isNotSatisfyBy(existedVersionInMainNodeModules)
            ) {
              const verrrr = tempProj.npmPackages.package(dedupePkgName);
              Helpers.warn(`[override package][dedupe "${packageName}"] ${chalk.bold(dedupePkgName)}@${verrrr?.version} won't be satisfy`
                + ` in this repository by version "${existedVersionInMainNodeModules}"`);
            }
          });
        tempProj.node_modules.dedupe(toDedupe);
        //#endregion
        //#region link to main repo
        const overrideFrom = tempProj.npmPackages.package(packageName).location;
        const overrideDest = this.project.npmPackages.package(packageName).location;
        // console.log(`overrideFrom: ${overrideFrom}`)
        // console.log(`overrideDest: ${overrideDest}`)
        Helpers.removeIfExists(overrideDest);
        if (Helpers.exists(overrideFrom)) { // TODO quick fix
          Helpers.createSymLink(overrideFrom, overrideDest); // TODO something is causing loop

          Helpers.foldersFrom(tempProj.node_modules.path)
            .filter(depName => path.basename(depName) !== packageName)
            .forEach(depName => {
              depName = path.basename(depName);
              const verrr = tempProj.npmPackages.package(depName).version;
              const fromProj = tempProj.npmPackages.package(depName);
              const destProj = this.project.npmPackages.package(depName);
              if (Helpers.exists(destProj.location)) {
                if (fromProj.isNotSatisfyBy(destProj.version)) {
                  Helpers.warn(`

                  [override package][link "${packageName}"] ${chalk.bold(depName)}@${verrr} won't be satisfy`
                    + ` in this repository by version "${destProj.version}"

                    `);
                } else {
                  Helpers.log(`[override package][link "${packageName}"] copying new package ${chalk.bold(depName)} to main node_modules`)
                }
              } else {
                Helpers.createSymLink(fromProj.location, destProj.location);
              }
            });
        }

        //#endregion
      }
    });
  }
  //#endregion

  //#endregion

  //#region public api

  //#region install/reinstall all packages
  public install(action: 'install' | 'uninstall' = 'install', ...packages: PackageType[]) {
    Helpers.log(`START SMART INSTALL...  for ${this.project.genericName}`);
    if (packages.length > 0) {
      packages.forEach(p => {
        this.project.packageJson.data.tnp.overrided.dependencies[p.name] = (action === 'uninstall')
          ? void 0 : p.version;
      });

      this.project.packageJson.save(`save afte smart ${action} of package(s):
  ${packages.map(p => {
        return `- ${p.name} @${p.version}`;
      }).join('\n')}
      `);
    }
    const containerCore = this.containerCore;
    if (containerCore.location !== this.project.location) {
      this.project.node_modules.remove();
      this.project.node_modules.copyFrom(containerCore, {
        triggerMsg: 'smart node_modules instalation',
        useDirectlySmartNodeModules: true
      });
      this.handlePackagesOverride();
    }
    Helpers.logSuccess(`npm packages install done for ${this.project.genericName}`);
  }
  //#endregion

  //#endregion
}

//#region helpers

//#region prepare
function prepareContainerProject(containerCoreProject: Project, currentProject: Project) {
  const currentContainerCorePackages = _.cloneDeep(containerCoreProject.packageJson.dependencies);

  // containerCoreProject.packageJson.save(`prepare for smart node_modules`);
  // const updartedContainerCorePackages = _.cloneDeep(containerCoreProject.packageJson.dependencies);
  // const packgesHasChanges = !_.isEqual(currentContainerCorePackages, updartedContainerCorePackages);

  if (!Helpers.exists(containerCoreProject.smartNodeModules.path)) {
    Helpers.mkdirp(path.dirname(containerCoreProject.smartNodeModules.path));
    [
      config.file.package_json,
      config.file.package_json__tnp_json,
      config.file.package_json__tnp_json5,
    ].forEach(pkgFilename => {
      const sourcePj = path.join(containerCoreProject.location, pkgFilename);
      if (Helpers.exists(sourcePj)) {
        const destPj = path.join(path.dirname(containerCoreProject.smartNodeModules.path), pkgFilename);
        Helpers.removeFileIfExists(destPj);
        Helpers.createSymLink(
          sourcePj,
          destPj,
        );
      }
    })

  }
  const smartTempContainerCorePackagesProj = Project.From(path.dirname(containerCoreProject.smartNodeModules.path)) as Project;
  // TODO this is not available when moving things
  const reinstallForceSmartNodeModules = (
    (
      containerCoreProject.isContainerCoreProject && (containerCoreProject.location === currentProject.location)
    )
  );
  // || packgesHasChanges;

  // if (packgesHasChanges) {
  //   Helpers.info(`
  //   [smart-node_modules]

  //   Container core "${containerCoreProject.genericName}" packges has CHAGNED
  //   reinstalling....

  //   `)
  // } else {
  //   Helpers.info(`
  //   [smart-node_modules]

  //   Container core "${containerCoreProject.genericName}" UP TO DATE..

  //   `);
  // }

  if (!smartTempContainerCorePackagesProj.node_modules.exist || reinstallForceSmartNodeModules) {
    smartTempContainerCorePackagesProj.npmPackages.installFromArgs('', true);
    smartTempContainerCorePackagesProj.node_modules.dedupe({ reason: 'smart temp container dedeupe' }); // TODO QUICK FIX
  }

  if (!reinstallForceSmartNodeModules && containerCoreProject.node_modules.exist) {
    Helpers.log(`

    No need for update of node_modules links for ${CLI.chalk.bold(containerCoreProject.genericName)}

    `);
    return;
  }
  Helpers.actionWrapper(() => {
    const folders = Helpers.foldersFrom(smartTempContainerCorePackagesProj.node_modules.path);
    folders.forEach(from => {
      // Helpers.info(`linking from smart to node_modules: ${path.dirname(from).startsWith('@')
      //   ? from.split('/').slice(-2).join('/')
      //   : from.split('/').slice(-1).join('/')
      //   }`)
      const dest = path.join(containerCoreProject.node_modules.path, path.basename(from));
      Helpers.remove(dest, true);
      Helpers.createSymLink(from, dest);
    });
  }, `updating node_modules links for ${CLI.chalk.bold(containerCoreProject.genericName)} `);
}
//#endregion

//#endregion
