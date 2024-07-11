import { path } from 'tnp-core/src';
import * as semver from 'semver';

import { Project } from '../../abstract/project';
import { Models } from '../../../models';
import { Helpers } from 'tnp-helpers/src';
import { config } from 'tnp-config/src';

import { _ } from 'tnp-core/src';
import {
  reolveAndSaveDeps,
  removeDependencyAndSave,
  setDependencyAndSave,
  findVersionRange,
} from './package-json-helpers.backend';
import { PackageJsonCore } from './package-json-core.backend';
import { PackageJsonDepsCoreCategories } from './package-json-deps-categories.backend';
import { CoreModels } from 'tnp-core/src';

export class PackageJsonBase extends PackageJsonCore {
  public readonly project: Project;
  private reasonToHidePackages = '';
  private reasonToShowPackages = '';
  private readonly coreCategories: PackageJsonDepsCoreCategories;

  constructor(options: { data: Object; location?: string; project?: Project }) {
    super(
      options.project && !options.location
        ? options.project.location
        : options.location,
    );
    if (_.isObject(options)) {
      if (options.project && !options.location) {
        options.location = options.project.location;
      }
      _.merge(this, options);

      this.data = _.merge(
        {
          tnp: {
            resources: [],
          },
        } as Models.IPackageJSON,
        options.data as any,
      );
    }
    this.coreCategories = new PackageJsonDepsCoreCategories(this.project);
  }

  public save(reasonToShowPackages: string) {
    this.reasonToShowPackages = `\n${reasonToShowPackages}`;
    this.prepareForSave('save');
    this.writeToDisc();
  }

  public showDeps(reasonToShowPackages: string) {
    this.reasonToHidePackages = `\n${reasonToShowPackages}`;
    this.prepareForSave('show');
    this.writeToDisc();
  }

  public hideDeps(reasonToHidePackages: string) {
    this.reasonToHidePackages = `\n${reasonToHidePackages}`;
    this.prepareForSave('hide');
    this.writeToDisc(true);
  }

  // public updateHooks() {
  //   Helpers.log('[package json] updating hooks');
  //   if (
  //     !(
  //       this.data.husky &&
  //       this.data.husky.hooks &&
  //       _.isString(this.data.husky.hooks['pre-push'])
  //     )
  //   ) {
  //     this.data.husky = {
  //       hooks: {
  //         'pre-push': `${config.frameworkName} deps:show:if:standalone`,
  //       },
  //     };
  //     this.save('Update hooks');
  //   }
  //   Helpers.log('[package json] updating hooks done');
  // }

  private prepareForSave(
    action: 'save' | 'show' | 'hide' = 'save',
    caller?: Project,
  ) {
    if (caller?.location === this.project.location) {
      return;
    }
    if (this.project.isUnknowNpmProject) {
      Helpers.log(`Prepare for save not for unknow projects`);
      return;
    }

    if (this.project.__isStandaloneProject || this.project.__isContainer) {
      const tnp = Project.ins.Tnp;
      tnp.__packageJson.prepareForSave(action, tnp);
    }

    reolveAndSaveDeps(
      this.project,
      action,
      this.reasonToHidePackages,
      this.reasonToShowPackages,
    );
  }

  linkTo(destination: string) {
    (() => {
      const source = path.join(this.project.location, config.file.package_json);
      const dest = path.join(destination, config.file.package_json);
      Helpers.removeFileIfExists(dest);
      Helpers.createSymLink(source, dest);
    })();

    (() => {
      const source = path.join(
        this.project.location,
        config.file.firedev_jsonc,
      );
      const dest = path.join(destination, config.file.firedev_jsonc);
      Helpers.removeFileIfExists(dest);
      Helpers.createSymLink(source, dest);
    })();
  }

  public removeDependencyAndSave = (p: CoreModels.Package, reason: string) => {
    this.prepareForSave('save');
    removeDependencyAndSave(p, reason, this.project);
  };
  public setDependencyAndSave = (p: CoreModels.Package, reason: string) => {
    this.prepareForSave('save');
    setDependencyAndSave(p, reason, this.project);
  };

  /**
   * Look all package.json dependencies and check if version range
   * of dependency is satisfy
   * @param dependency
   */
  public checDepenciesAreSatisfyBy(dependency: Project): boolean {
    const versionRange = findVersionRange(this.project, dependency);
    if (!versionRange) {
      Helpers.error(
        `Version range not avaliable root: ${this.name} dependency: ${dependency.name}`,
        true,
        true,
      );
      return false;
    }
    const result = semver.satisfies(dependency.version, versionRange);
    const namePackage = `${dependency.name}@${dependency.version}`;
    Helpers.log(
      `[checDepenciesAreSatisfyBy] ${result} for ${namePackage} in range ${versionRange} withing ${this.name}`,
    );
    return result;
  }

  public updateFrom(locations: string[]) {
    for (let index = 0; index < locations.length; index++) {
      const location = locations[index];
      const otherProj = Project.ins.From(location);
      Helpers.log(`Updating package.json from ${otherProj.name}`);
      updaPackage(
        this.project,
        otherProj.__packageJson.data.dependencies,
        otherProj,
      );
      updaPackage(
        this.project,
        otherProj.__packageJson.data.devDependencies,
        otherProj,
      );
    }
  }
}

function updaPackage(mainProj: Project, deps: Object, otherProj: Project) {
  if (!deps) {
    Helpers.log(`Cant read deps`);
    return;
  }
  Object.keys(deps).forEach(depName => {
    const version = deps[depName];
    if (_.isString(version)) {
      mainProj.__packageJson.setDependencyAndSave(
        {
          name: depName,
          version,
        },
        `update from project: ${otherProj.name}`,
      );
    }
  });
}
