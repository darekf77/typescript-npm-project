//#region imports
import { crossPlatformPath, moment, path } from 'tnp-core'
import { fse } from 'tnp-core'
import { _ } from 'tnp-core';

import type { Project } from '../../abstract';
import { Helpers } from 'tnp-helpers';
import { FeatureForProject } from '../../abstract';
import { Models } from 'tnp-models';
import { config } from 'tnp-config';
import * as semver from 'semver';
import { PackagesRecognition } from '../package-recognition/packages-recognition';
import {
  executeCommand, fixOptions, prepareCommand, prepareTempProject,
  copyMainProject, copyMainProjectDependencies
} from './npm-packages-helpers.backend';
import { CLASS } from 'typescript-class-helpers';
//#endregion

export class NpmPackagesCore extends FeatureForProject {


  global(globalPackageName: string, packageOnly = false) {
    const ProjectClass = CLASS.getBy('Project') as typeof Project;
    const oldContainer = ProjectClass.by('container', 'v1') as Project;
    if (!oldContainer.node_modules.exist) {
      Helpers.info('initing container v1 for global packages')
      oldContainer.run(`${config.frameworkName} init`).sync();
    }
    if (packageOnly) {
      return crossPlatformPath(path.join(oldContainer.node_modules.path, globalPackageName));
    }
    return crossPlatformPath(path.join(oldContainer.node_modules.path, globalPackageName, `bin/${globalPackageName}`));
  }

  protected get emptyNodeModuls() {
    return !this.project.node_modules.exist;
  }

  package(pacakgeName: string) {
    const ProjectClass = CLASS.getBy('Project') as typeof Project;
    const p = ProjectClass.From(this.project.node_modules.pathFor(pacakgeName));
    const ver = p?.version;
    const that = this;
    return {
      isSatisfyBy(versionOrRange: string) {
        return !ver ? false : semver.satisfies(ver, versionOrRange);
      },
      isNotSatisfyBy(versionOrRange: string) {
        return !ver ? false : !that.package(pacakgeName).isSatisfyBy(versionOrRange);
      },
      get version() {
        return ver;
      },
      get location() {
        return that.project.node_modules.pathFor(pacakgeName);
      },
      get exists() {
        return !!p
      }
    }
  }

  protected actualNpmProcess(options?: Models.npm.ActualNpmInstallOptions) {
    if (this.project.isDocker) {
      return;
    }
    const ProjectClass = CLASS.getBy('Project') as typeof Project;

    const { generatLockFiles, useYarn, pkg, reason, remove, smoothInstall } = fixOptions(options);
    const yarnLockPath = path.join(this.project.location, config.file.yarn_lock);
    const yarnLockExisits = fse.existsSync(yarnLockPath);
    const command: string = prepareCommand(pkg, remove, useYarn, this.project);
    Helpers.log(`

    [actualNpmProcess][${smoothInstall ? 'smooth' : 'normal'}] npm instalation...

    `)
    if (remove) {
      executeCommand(command, this.project);
    } else {
      if (global.testMode) {
        Helpers.log(`Test mode: normal instalation`)
        if (pkg) {
          (ProjectClass.Tnp as Project).node_modules.copy(pkg).to(this.project);
        } else {
          this.project.node_modules.copyFrom(ProjectClass.Tnp as Project, { triggerMsg: `Test mode instalaltion` });
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
            const workspaceForVersion = (ProjectClass.by(this.project._type, this.project._frameworkVersion) as Project).parent;
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
    PackagesRecognition.fromProject(this.project).start(true, '[actualNpmProcess] after npm i');

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
    Helpers.log(pkg)

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
