//#region imports
import {
  chalk,
  crossPlatformPath,
  dateformat,
  moment,
  path,
} from 'tnp-core/src';
import { fse } from 'tnp-core/src';
import { _ } from 'tnp-core/src';

import { Project } from '../../abstract/project';
import { Models } from '../../../models';
import { Helpers } from 'tnp-helpers/src';
import { BaseFeatureForProject } from 'tnp-helpers/src';
import { config } from 'tnp-config/src';
import * as semver from 'semver';
import { PackagesRecognition } from '../package-recognition/packages-recognition';
import { executeCommand, fixOptions } from './npm-packages-helpers.backend';
import { CoreModels } from 'tnp-core/src';
//#endregion

export class NpmPackagesCore extends BaseFeatureForProject<Project> {
  async global(globalPackageName: string, packageOnly = false) {
    const oldContainer = Project.by('container', 'v1') as Project;
    if (!oldContainer.__node_modules.exist) {
      Helpers.info('initing container v1 for global packages');
      await oldContainer.init('old container init');
    }
    if (packageOnly) {
      return crossPlatformPath(
        path.join(oldContainer.__node_modules.path, globalPackageName),
      );
    }
    return crossPlatformPath(
      path.join(
        oldContainer.__node_modules.path,
        globalPackageName,
        `bin/${globalPackageName}`,
      ),
    );
  }

  package(pacakgeName: string) {
    const p = Project.ins.From(
      this.project.__node_modules.pathFor(pacakgeName),
    );
    const ver = p?.version;
    const that = this;
    return {
      isSatisfyBy(versionOrRange: string) {
        return !ver ? false : semver.satisfies(ver, versionOrRange);
      },
      isNotSatisfyBy(versionOrRange: string) {
        return !ver
          ? false
          : !that.package(pacakgeName).isSatisfyBy(versionOrRange);
      },
      get version() {
        return ver;
      },
      get location() {
        return that.project.__node_modules.pathFor(pacakgeName);
      },
      get exists() {
        return !!p;
      },
    };
  }

  // TOOD QUICK_FIX
  private modifyPackageJson(project: Project) {
    const packgeJson = project.readJson(config.file.package_json) as {
      dependencies: { [packageName: string]: string };
    };
    const trusted = project.__trusted;
    for (const trustedPackageName of trusted) {
      if (packgeJson.dependencies[trustedPackageName]) {
        if (semver.valid(packgeJson.dependencies[trustedPackageName])) {
          const plainVersionRegex = /^\d+\.\d+\.\d+$/;

          if (
            plainVersionRegex.test(packgeJson.dependencies[trustedPackageName])
          ) {
            packgeJson.dependencies[trustedPackageName] =
              `~${packgeJson.dependencies[trustedPackageName]}`;
          }
        }
      }
    }
    project.writeJson(config.file.package_json, packgeJson);
  }

  protected async actualNpmProcess(options?: CoreModels.NpmInstallOptions) {
    if (this.project.__isDocker) {
      return;
    }
    const { useYarn, pkg } = fixOptions(options);

    const command: string = await this.project.npmHelpers.prepareCommand({
      pkg,
      useYarn,
    });
    this.modifyPackageJson(this.project);

    Helpers.taskStarted(`

    [${dateformat(new Date(), 'dd-mm-yyyy HH:MM:ss')}]
    npm install process for ${this.project.genericName} started...

    `);

    if (pkg?.installType === 'remove') {
      executeCommand(command, this.project);
    } else {
      try {
        executeCommand(command, this.project);

        // Helpers.taskStarted('Rebuilding better-sqlite for current electron version'); // needed for electorn
        // this.project.run('npm-run electron-rebuild -f -w better-sqlite3', { output: true }).sync();
        // this.project.run('npm-run electron-builder install-app-deps', { output: true }).sync();
        // Helpers.taskDone('Done rebuilding electorn');
      } catch (err) {
        console.error(err);
        //#region message about memory
        Helpers.error(
          `[${config.frameworkName}] Error during npm install...

        `,
          false,
          true,
        );
        //#endregion
      }
      Helpers.info(`Reinstal done`);
    }

    Helpers.taskDone(`
    npm install process for ${this.project.genericName} done.
    [${dateformat(new Date(), 'dd-mm-yyyy HH:MM:ss')}]`);

    this.project.quickFixes.unpackNodeModulesPackagesZipReplacements();
    await PackagesRecognition.startFor(this.project, 'after npm install');

    if (!options.generateYarnOrPackageJsonLock) {
      if (useYarn) {
        const yarnLockPath = this.project.pathFor(config.file.yarn_lock);
        const yarnLockExisits = fse.existsSync(yarnLockPath);
        if (yarnLockExisits) {
          if (this.project.git.isInsideGitRepo) {
            this.project.git.resetFiles(config.file.yarn_lock);
          }
        } else {
          fse.existsSync(yarnLockPath) &&
            Helpers.removeFileIfExists(yarnLockPath);
        }
      } else {
        const packageLockPath = this.project.pathFor(
          config.file.package_lock_json,
        );
        fse.existsSync(packageLockPath) &&
          Helpers.removeFileIfExists(packageLockPath);
      }
    }
  }
}
