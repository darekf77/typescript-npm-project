//#region imports
import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as glob from 'glob';
import * as _ from 'lodash';

import { Project } from '../../abstract';
import { Helpers } from 'tnp-helpers';
import { FeatureForProject } from '../../abstract';
import { Models } from 'tnp-models';
import { config } from '../../../config';
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

  protected actualNpmProcess(options?: Models.npm.ActualNpmInstallOptions) {
    if (this.project.isDocker) {
      return;
    }
    const { generatLockFiles, useYarn, pkg, reason, remove, smoothInstall } = fixOptions(options);
    const yarnLockPath = path.join(this.project.location, config.file.yarn_lock);
    const yarnLockExisits = fse.existsSync(yarnLockPath);
    const command: string = prepareCommand(pkg, remove, useYarn, this.project);
    Helpers.log(`[actualNpmProcess] command: ${command} in folder: <...>/${this.project.location}`)
    if (remove) {
      executeCommand(command, this.project);
    } else {
      if (global.testMode) {
        Helpers.log(`Test mode: normal instalation`)
        if (pkg) {
          (Project.Tnp as Project).node_modules.copy(pkg).to(this.project);
        } else {
          this.project.node_modules.copyFrom(Project.Tnp as Project, `Test mode instalaltion`);
        }
      } else {
        if (smoothInstall) {
          this.smoothInstallPrepare(pkg);
        } else {
          try {
            executeCommand(command, this.project);
          } catch (err) {
            Helpers.error(err, true, true);
            Helpers.error(`Error durinf npm instalation`, false, true);
          }

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
          fse.existsSync(yarnLockPath) && Helpers.removeFileIfExists(yarnLockPath);
        }
      } else {
        const packageLockPath = path.join(this.project.location, config.file.package_lock_json)
        fse.existsSync(packageLockPath) && Helpers.removeFileIfExists(packageLockPath);
      }
    }
  }


  private smoothInstallPrepare(pkg: Models.npm.Package) {
    console.log(pkg)

    const tmpProject = prepareTempProject(this.project, pkg);
    const mainProjects = copyMainProject(tmpProject, this.project, pkg);
    copyMainProjectDependencies(mainProjects, tmpProject, this.project, pkg);
    tmpProject.removeItself();
  }

}
