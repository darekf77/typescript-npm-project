//#region imports
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as rimraf from "rimraf";


import { Project } from '../../abstract';
import { info, checkValidNpmPackageName, error, log, warn, tryCopyFrom } from '../../../helpers';
import { FeatureForProject } from '../../abstract';
import { Package, InstalationTypeArr, InstalationType, LibType, ActualNpmInstallOptions } from '../../../models';
import config from '../../../config';
import { PackagesRecognitionExtended } from '../packages-recognition-extended';
import {
  executeCommand, fixOptions, prepareCommand, prepareTempProject,
  copyMainProject, copyMainProjectDependencies
} from './npm-packages-helpers.backend';
//#endregion

export class NpmPackagesCore extends FeatureForProject {

  protected get emptyNodeModuls() {
    return !this.project.node_modules.exist;
  }

  protected actualNpmProcess(options?: ActualNpmInstallOptions) {
    const { generatLockFiles, useYarn, pkg, reason, remove, smoothInstall } = fixOptions(options);
    const yarnLockPath = path.join(this.project.location, config.file.yarn_lock);
    const yarnLockExisits = fse.existsSync(yarnLockPath);
    const command: string = prepareCommand(pkg, remove, useYarn);
    if (remove) {
      executeCommand(command, this.project);
    } else {
      if (global.testMode) {
        log(`Test mode: normal instalation`)
        if (pkg) {
          Project.Tnp.node_modules.copy(pkg).to(this.project);
        } else {
          this.project.node_modules.copyFrom(Project.Tnp, `Test mode instalaltion`);
        }
      } else {
        if (smoothInstall) {
          this.smoothInstallPrepare(pkg);
        } else {
          executeCommand(command, this.project);
        }
      }
    }

    this.project.quickFixes.nodeModulesPackagesZipReplacement();
    PackagesRecognitionExtended.fromProject(this.project).start(true);

    if (!generatLockFiles) {
      if (useYarn) {
        if (yarnLockExisits) {
          if (this.project.git.isGitRepo) {
            this.project.git.resetFiles(config.file.yarn_lock);
          }
        } else {
          fse.existsSync(yarnLockPath) && fse.unlinkSync(yarnLockPath);
        }
      } else {
        const packageLockPath = path.join(this.project.location, config.file.package_lock_json)
        fse.existsSync(packageLockPath) && fse.unlinkSync(packageLockPath);
      }
    }
  }


  private smoothInstallPrepare(pkg: Package) {
    const tmpProject = prepareTempProject(this.project, pkg);
    const mainProjects = copyMainProject(tmpProject, this.project, pkg);
    copyMainProjectDependencies(mainProjects, tmpProject, this.project, pkg);
    tmpProject.removeItself();
  }

}

