
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as JSON5 from 'json5';
import * as semver from 'semver';
import chalk from 'chalk';

import { Project } from '../../abstract';
import { LibType, IPackageJSON, DependenciesFromPackageJsonStyle, UIFramework, Package, ArrNpmDependencyType } from '../../../models';
import { tryRemoveDir, sortKeys as sortKeysInObjAtoZ, run, error, info, warn, log, HelpersLinks } from '../../../helpers';
import { config } from '../../../config';

import * as _ from 'lodash';
import { Morphi } from 'morphi';
import { reolveAndSaveDeps, removeDependencyAndSave, setDependencyAndSave, findVersionRange } from './package-json-helpers.backend';
import { PackageJsonCore } from './package-json-core.backend';
import { PackageJsonDepsCoreCategories } from './package-json-deps-categories.backend';

export class PackageJsonBase extends PackageJsonCore {

  public readonly project: Project;
  private reasonToHidePackages: string = ''
  private reasonToShowPackages: string = '';
  private readonly coreCategories: PackageJsonDepsCoreCategories;

  constructor(options: { data: Object, location?: string; project?: Project; }) {
    super((options.project && !options.location) ? options.project.location : options.location);
    if (_.isObject(options)) {
      if (options.project && !options.location) {
        options.location = options.project.location;
      }
      _.merge(this, options);

      this.data = _.merge({
        tnp: {
          resources: []
        }
      } as IPackageJSON, options.data as any);
    }
    this.coreCategories = new PackageJsonDepsCoreCategories(this.project);
  }

  public save(reasonToShowPackages: string) {
    this.reasonToShowPackages = `\n${reasonToShowPackages}`;
    this.prepareForSave('save');
    this.writeToDisc();
  }

  public showDeps(reasonToHidePackages: string) {
    this.reasonToHidePackages = `\n${reasonToHidePackages}`;
    this.prepareForSave('show');
    this.writeToDisc();
  }

  public hideDeps(reasonToHidePackages: string) {
    this.reasonToHidePackages = `\n${reasonToHidePackages}`;
    this.prepareForSave('hide');
    this.writeToDisc();
  }

  public updateHooks() {
    if (!(this.data.husky && this.data.husky.hooks && _.isString(this.data.husky.hooks['pre-push']))) {
      this.data.husky = {
        hooks: {
          'pre-push': 'tnp deps:show:if:standalone'
        }
      };
      this.save('Update hooks');
    }
  }

  private prepareForSave(action: 'save' | 'show' | 'hide' = 'save', caller?: Project) {
    if (caller === this.project) {
      return;
    }
    if (this.project.isUnknowNpmProject) {
      log(`Prepare for save not for unknow projects`);
      return;
    }

    if (this.project.isStandaloneProject || this.project.isContainer || (this.project.isWorkspace && !this.project.isContainerChild)) {
      Project.Tnp.packageJson.prepareForSave(action, Project.Tnp);
    }

    if (this.project.isContainerChild || this.project.isWorkspaceChildProject) {
      this.project.parent.packageJson.prepareForSave(action);
    }

    reolveAndSaveDeps(this.project, action, this.reasonToHidePackages, this.reasonToShowPackages);
  }

  public removeDependencyAndSave = (p: Package, reason: string) => {
    this.prepareForSave('save')
    removeDependencyAndSave(p, reason, this.project);
  }
  public setDependencyAndSave = (p: Package, reason: string) => {
    this.prepareForSave('save')
    setDependencyAndSave(p, reason, this.project)
  }

  /**
   * Look all package.json dependencies and check if version range
   * of dependency is satisfy
   * @param dependency
   */
  public checDepenciesAreSatisfyBy(dependency: Project): boolean {

    const versionRange = findVersionRange(this.project, dependency);
    if (!versionRange) {
      error(`Version range not avaliable root: ${this.name} dependency: ${dependency.name}`, true, true);
      return false;
    }
    const result = semver.satisfies(dependency.version, versionRange);
    const namePackage = `${dependency.name}@${dependency.version}`;
    log(`[checDepenciesAreSatisfyBy] ${result} for ${namePackage} in range ${versionRange} withing ${this.name}`);
    return result;
  }

  public reset() {
    if (this.project.isTnp) {
      log(`Npm reset not available for Tnp project`)
      return;
    }
    if (this.project.isWorkspaceChildProject || this.project.isContainerChild) {
      this.project.parent.packageJson.reset();
    }
    this.data.tnp.overrided.dependencies = {};
    this.save(`reset of npm`);
  }

  async setCategoryFor(pkg: Package) {
    await this.coreCategories.setWizard(pkg)
  }

  public updateFrom(locations: string[]) {
    for (let index = 0; index < locations.length; index++) {
      const location = locations[index];
      const otherProj = Project.From(location);
      log(`Updating package.json from ${otherProj.name}`)
      updaPackage(this.project, otherProj.packageJson.data.dependencies, otherProj);
      updaPackage(this.project, otherProj.packageJson.data.devDependencies, otherProj);
    }
  }

}

function updaPackage(mainProj: Project, deps: Object, otherProj: Project) {
  if (!deps) {
    log(`Cant read deps`);
    return;
  }
  Object.keys(deps).forEach(depName => {
    const version = deps[depName];
    if (_.isString(version)) {
      mainProj.packageJson.setDependencyAndSave({
        name: depName,
        version
      }, `update from project: ${otherProj.name}`);
    }
  });
}

