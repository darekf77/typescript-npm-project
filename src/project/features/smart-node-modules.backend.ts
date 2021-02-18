import * as _ from 'lodash';
import * as path from 'path';
import chalk from 'chalk';
import { FeatureForProject, Project } from '../abstract';
import { config } from 'tnp-config';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';

export type OverridePacakge = { [name: string]: string | null; };
export type PackageType = Pick<Models.npm.Package, 'name' | 'version'>;

export class SmartNodeModules extends FeatureForProject {
  private static _prepared = {};

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

    const frameworkVersion = this.project._frameworkVersion;
    const container = Project.by('container', frameworkVersion) as Project;
    if (!SmartNodeModules._prepared[container.location]) {
      prepare(container);
    }
    SmartNodeModules._prepared[container.location] = container;
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
  public pathFor(packageName?: string) {
    if (!packageName) {
      packageName = this.project.name;
    }
    return path.join(
      this.project.location,
      `${config.folder.tmp}-smart-${config.folder.node_modules}`,
      `for`,
      packageName,
      config.folder.node_modules,
    );
  }
  //#endregion

  //#region smart node_modules exists for whole project
  public get exists() {
    return Helpers.exists(this.path);
  }
  //#endregion

  //#region packages to override after smart node_modules instalation
  private get toOverride(): OverridePacakge {
    return this.project.packageJson.data?.tnp?.overrided?.dependencies || {};
  }
  private handlePackagesOverride() {
    const toOverride = this.toOverride;

    const mainSmartNodeModulesFolder = path.dirname(path.dirname(this.project.smartNodeModules.path));
    Helpers.foldersFrom(mainSmartNodeModulesFolder)
      .filter(f => f !== this.project.name)
      .forEach(f => {
        const additonalFolderToRemove = path.join(this.project.smartNodeModules.pathFor(f))
        Helpers.removeFolderIfExists(additonalFolderToRemove);
      });

    _.keys(toOverride).map(packageName => {
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
          .filter(dedupePkgName => _.isString(dedupePkgName))
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
        Helpers.removeIfExists(overrideDest);
        Helpers.createSymLink(overrideFrom, overrideDest);

        Helpers.foldersFrom(tempProj.node_modules.path)
          .filter(depName => path.basename(depName) !== packageName)
          .forEach(depName => {
            depName = path.basename(depName);
            const verrr = tempProj.npmPackages.package(depName).version;
            const fromProj = tempProj.npmPackages.package(depName);
            const destProj = this.project.npmPackages.package(depName);
            if (Helpers.exists(destProj.location)) {
              if (fromProj.isNotSatisfyBy(destProj.version)) {
                Helpers.warn(`[override package][link "${packageName}"] ${chalk.bold(depName)}@${verrr} won't be satisfy`
                  + ` in this repository by version "${destProj.version}"`);
              } else {
                Helpers.log(`[override package][link "${packageName}"] copying new package ${chalk.bold(depName)} to main node_modules`)
              }
            } else {
              Helpers.createSymLink(fromProj.location, destProj.location);
            }
          });
        //#endregion
      }
    });
  }
  //#endregion

  //#endregion

  //#region public api

  //#region install/reinstall all packages
  public install(action: 'install' | 'uninstall' = 'install', ...packages: PackageType[]) {
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
    const c = this.containerCore;
    this.project.node_modules.remove();
    this.project.node_modules.copyFrom(c, 'smart node_modules instalation');
    this.handlePackagesOverride();
    Helpers.info(`DONE SMART INSTALL`);
  }
  //#endregion

  //#endregion
}

//#region helpers

//#region prepare
function prepare(project: Project) {

  project.packageJson.save(`prepare for smart node_modules`)
  if (!Helpers.exists(project.smartNodeModules.path)) {
    Helpers.mkdirp(path.dirname(project.smartNodeModules.path));
    Helpers.createSymLink(
      project.packageJson.path,
      path.join(path.dirname(project.smartNodeModules.path), config.file.package_json),
    );
  }
  const tmpProj = Project.From(path.dirname(project.smartNodeModules.path)) as Project;
  if (!tmpProj.node_modules.exist) {
    tmpProj.npmPackages.installFromArgs('');
  }

  Helpers.actionWrapper(() => {
    Helpers.foldersFrom(tmpProj.node_modules.path).forEach(from => {
      const dest = path.join(project.node_modules.path, path.basename(from));
      Helpers.removeFileIfExists(dest);
      Helpers.createSymLink(from, dest);
    });
  }, 'updating node_modules links');
}
//#endregion

//#endregion
