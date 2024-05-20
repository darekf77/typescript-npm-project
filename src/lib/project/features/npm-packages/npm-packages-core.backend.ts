//#region imports
import { crossPlatformPath, moment, path } from 'tnp-core/src'
import { fse } from 'tnp-core/src'
import { _ } from 'tnp-core/src';

import { Project } from '../../abstract/project';
import { Models } from '../../../models';
import { Helpers } from 'tnp-helpers/src';
import { BaseFeatureForProject } from 'tnp-helpers/src';
import { config } from 'tnp-config/src';
import * as semver from 'semver';
import { PackagesRecognition } from '../package-recognition/packages-recognition';
import {
  executeCommand, fixOptions, prepareCommand
} from './npm-packages-helpers.backend';
//#endregion

export class NpmPackagesCore extends BaseFeatureForProject<Project> {

  global(globalPackageName: string, packageOnly = false) {

    const oldContainer = Project.by('container', 'v1') as Project;
    if (!oldContainer.__node_modules.exist) {
      Helpers.info('initing container v1 for global packages')
      oldContainer.run(`${config.frameworkName} init`).sync();
    }
    if (packageOnly) {
      return crossPlatformPath(path.join(oldContainer.__node_modules.path, globalPackageName));
    }
    return crossPlatformPath(path.join(oldContainer.__node_modules.path, globalPackageName, `bin/${globalPackageName}`));
  }

  protected get emptyNodeModuls() {
    return !this.project.__node_modules.exist;
  }

  package(pacakgeName: string) {
    const p = Project.ins.From(this.project.__node_modules.pathFor(pacakgeName));
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
        return that.project.__node_modules.pathFor(pacakgeName);
      },
      get exists() {
        return !!p
      }
    }
  }

  protected actualNpmProcess(options?: Models.ActualNpmInstallOptions) {
    if (this.project.__isDocker) {
      return;
    }
    const { generatLockFiles, useYarn, pkg, reason, remove } = fixOptions(options);
    const yarnLockPath = path.join(this.project.location, config.file.yarn_lock);
    const yarnLockExisits = fse.existsSync(yarnLockPath);
    const command: string = prepareCommand(pkg, remove, useYarn, this.project);
    Helpers.log(`

    [actualNpmProcess] npm instalation...

    `);


    if (remove) {
      executeCommand(command, this.project);
    } else {
      try {
        executeCommand(command, this.project);

        // Helpers.taskStarted('Rebuilding better-sqlite for current electron version'); // needed for electorn
        // this.project.run('npm-run electron-rebuild -f -w better-sqlite3', { output: true }).sync();
        // this.project.run('npm-run electron-builder install-app-deps', { output: true }).sync();
        // Helpers.taskDone('Done rebuilding electorn');
      } catch (err) {
        if (config.frameworkName === 'tnp') {
          console.log(err)
        }
        Helpers.error(`[${config.frameworkName}] Error during npm install... try manual installation`, false, true);
      }
    }

    this.project.quickFixes.nodeModulesPackagesZipReplacement();
    PackagesRecognition.fromProject(this.project).start(true, '[actualNpmProcess] after npm i');

    if (!generatLockFiles) {
      if (useYarn) {
        if (yarnLockExisits) {
          if (this.project.git.isInsideGitRepo) {
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
