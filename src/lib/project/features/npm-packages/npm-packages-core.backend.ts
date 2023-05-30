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
  executeCommand, fixOptions, prepareCommand
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
    const { generatLockFiles, useYarn, pkg, reason, remove } = fixOptions(options);
    const yarnLockPath = path.join(this.project.location, config.file.yarn_lock);
    const yarnLockExisits = fse.existsSync(yarnLockPath);
    const command: string = prepareCommand(pkg, remove, useYarn, this.project);
    Helpers.log(`

    [actualNpmProcess] npm instalation...

    `)
    if (remove) {
      executeCommand(command, this.project);
    } else {
      try {
        executeCommand(command, this.project);
      } catch (err) {
        Helpers.error(err, true, true);
        Helpers.error(`Error during npm instalation`, false, true);
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


}
