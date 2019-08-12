
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
import { getAndTravelCoreDeps, reolveAndSaveDeps, removeDependencyAndSave, setDependencyAndSave, findVersionRange } from './package-json-helpers.backend';
import { PackageJsonCore } from './package-json-core.backend';


export class PackageJsonBase extends PackageJsonCore {
  public readonly project: Project;
  private reasonToHidePackages: string = ''
  private reasonToShowPackages: string = ''

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
  }

  public save(reasonToShowPackages: string) {
    this.reasonToShowPackages = `\n${reasonToShowPackages}`;
    if (!this.project.isUnknowNpmProject && !this.project.isContainer) {
      this.prepareForSave();
    }
    this.writeToDisc();
  }

  public hideDeps(reasonToHidePackages: string) {
    this.reasonToHidePackages = `\n${reasonToHidePackages}`;
    this.prepareForSave(false);
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

  private prepareForSave(showPackagesinFile = true) {

    if (!showPackagesinFile && this.project.isTnp) {
      showPackagesinFile = true;
    }

    if (this.project.isWorkspace || this.project.isWorkspaceChildProject || this.project.isContainer) {
      this.recreateForWorkspaceOrContainer(showPackagesinFile)
    } else if (this.project.isStandaloneProject) {
      this.recreateForStandalone(showPackagesinFile)
    }
  }

  private recreateForWorkspaceOrContainer(recreateInPackageJson: boolean) {
    const workspace = (this.project.isWorkspace || this.project.isContainer) ?
      this.project : (this.project.isWorkspaceChildProject ? this.project.parent : undefined)
    reolveAndSaveDeps(workspace, recreateInPackageJson, this.reasonToHidePackages, this.reasonToShowPackages);
  }

  private recreateForStandalone(recreateInPackageJson: boolean) {
    reolveAndSaveDeps(this.project, recreateInPackageJson, this.reasonToHidePackages, this.reasonToShowPackages);
  }

  public removeDependencyAndSave = (p: Package, reason: string) => removeDependencyAndSave(p, reason, this.project);
  public setDependencyAndSave = (p: Package, reason: string) => setDependencyAndSave(p, reason, this.project);

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

}



