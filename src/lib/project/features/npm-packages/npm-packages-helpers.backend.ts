//#region imports
import chalk from 'chalk';
import { crossPlatformPath, dateformat, path } from 'tnp-core/src';
import { fse } from 'tnp-core/src';
import { _, moment } from 'tnp-core/src';

import { Project } from '../../abstract/project';
import { Models } from '../../../models';
import { Helpers } from 'tnp-helpers/src';
import { config } from 'tnp-config/src';
import { CoreModels } from 'tnp-core/src';
//#endregion

const noTrace = global.hideLog && config.frameworkName === 'firedev';
const showNpmCommandOutput = !noTrace;

export function resolvePacakgesFromArgs(args: string[]): CoreModels.Package[] {
  let installType: CoreModels.InstalationType = '--save';
  return args
    .map(p => p.trim())
    .filter(p => {
      if (CoreModels.InstalationTypeArr.includes(p)) {
        installType = p as CoreModels.InstalationType;
        return false;
      }
      if (p.endsWith('@')) {
        p = `${p}latest`;
      }
      const res = Helpers.npm.checkValidNpmPackageName(p);
      if (!res) {
        Helpers.error(`Invalid package to install: "${p}"`, true, true);
      }
      return res;
    })
    .map(p => {
      if (!~p.search('@')) {
        return { name: p, installType };
      }
      if (p.endsWith('@')) {
        p = `${p}latest`;
      }
      const isOrg = p.startsWith('@');
      const [name, version] = (isOrg ? p.slice(1) : p).split('@');
      return { name: isOrg ? `@${name}` : name, version, installType };
    });
}

export function executeCommand(command: string, project: Project) {
  Helpers.info(`

   ${command} in folder:
   ${project.location}

   `);

  if (config.frameworkName === 'firedev' && project.__isContainerCoreProject) {
    Helpers.info(`
    [${dateformat(new Date(), 'dd-mm-yyyy HH:MM:ss')}]
    This may take a long time (usually 10-15min on 0.5Gb/s internet connection)...
    more than 1GB to download from npm...
    `);
  }

  project.run(command, { output: true, biggerBuffer: true }).sync();
  Helpers.writeFile(
    [project.__node_modules.path, '.install-date'],
    moment(new Date()).format('L LTS'),
  );
}

export function fixOptions(
  options?: CoreModels.NpmInstallOptions,
): CoreModels.NpmInstallOptions {
  if (_.isNil(options)) {
    options = {} as any;
  }
  if (_.isUndefined(options.generateYarnOrPackageJsonLock)) {
    options.generateYarnOrPackageJsonLock = false;
  }
  if (_.isUndefined(options.useYarn)) {
    options.useYarn = false;
  }
  if (_.isUndefined(options.remove)) {
    options.remove = false;
  }
  if (_.isUndefined(options.pkg)) {
    options.pkg = void 0;
  }
  if (_.isUndefined(options.reason)) {
    options.reason = `Reason not defined`;
  }
  return options;
}

export function fixOptionsNpmInstall(
  options: Models.NpmInstallOptions,
  project: Project,
): Models.NpmInstallOptions {
  if (_.isNil(options)) {
    options = {};
  }
  if (!_.isArray(options.npmPackages)) {
    options.npmPackages = [];
  }
  if (_.isUndefined(options.remove)) {
    options.remove = false;
  }
  return options;
}
