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
import { config } from 'tnp-config';
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
    Helpers.info(`

    [actualNpmProcess][${smoothInstall ? 'smooth' : 'normal'}] npm instalation...

    `)
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
          if (pkg) {
            this.smoothInstallPrepare(pkg);
          } else if (this.project.isStandaloneProject && !this.project.isTnp) {
            if (this.project.node_modules.exist && !this.project.node_modules.isLink && !global.tnpNonInteractive) {
              Helpers.pressKeyAndContinue(`
              [smooth-npm-installation]
              You are going to remove node_modules folder from ${this.project.node_modules.path}

              Press any key to continue.. `);
            }
            Helpers.removeFolderIfExists(this.project.node_modules.path);
            const workspaceForVersion = (Project.by(this.project._type, this.project._frameworkVersion) as Project).parent;
            if (!workspaceForVersion.node_modules.exist) {
              workspaceForVersion.run(`${config.frameworkName} init`).sync();
            }
            workspaceForVersion.node_modules.linkToProject(this.project)
          } else {
            Helpers.error(`Smooth install not supported here: ${this.project.location}`, false, true);
          }
        } else {
          try {
            executeCommand(command, this.project);
          } catch (err) {
            Helpers.error(err, true, true);
            Helpers.error(`Error during npm instalation`, false, true);
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
    const { mainProjectExisted, mainProjectInTemp } = copyMainProject(tmpProject, this.project, pkg);
    if (!mainProjectExisted) {
      Helpers.error(`Something went wrong...mainProjectExisted `);
    }
    if (!mainProjectInTemp) {
      Helpers.error(`Something went wrong... mainProjectInTemp`);
    }
    copyMainProjectDependencies({
      mainProjectExisted, mainProjectInTemp
    }, tmpProject, this.project, pkg)
    tmpProject.removeItself();
  }

}
