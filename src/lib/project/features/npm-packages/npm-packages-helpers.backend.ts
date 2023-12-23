//#region imports
import chalk from 'chalk';
import { path } from 'tnp-core/src';
import { fse } from 'tnp-core/src';
import { _, moment } from 'tnp-core/src';

import { Project } from '../../abstract';
import { Helpers } from 'tnp-helpers/src';
import { Models } from 'tnp-models/src';
import { config } from 'tnp-config/src';
//#endregion


export function resolvePacakgesFromArgs(args: string[]): Models.npm.Package[] {
  let installType: Models.npm.InstalationType = '--save';
  return args
    .map(p => p.trim())
    .filter(p => {
      if (Models.npm.InstalationTypeArr.includes(p)) {
        installType = p as Models.npm.InstalationType;
        return false;
      }
      if (p.endsWith('@')) {
        p = `${p}latest`;
      }
      const res = Helpers.npm.checkValidNpmPackageName(p)
      if (!res) {
        Helpers.error(`Invalid package to install: "${p}"`, true, true)
      }
      return res;
    })
    .map(p => {
      if (!~p.search('@')) {
        return { name: p, installType }
      }
      if (p.endsWith('@')) {
        p = `${p}latest`;
      }
      const isOrg = p.startsWith('@')
      const [name, version] = (isOrg ? p.slice(1) : p).split('@')
      return { name: isOrg ? `@${name}` : name, version, installType }
    })
}


export function executeCommand(command: string, project: Project) {

  Helpers.info(`

   ${command} in folder:
   ${project.location}

   `);

  if (config.frameworkName === 'firedev' && project.isContainerCoreProject) {
    Helpers.info('This may take a long time... more than 1GB to download from npm...')
  }

  project.run(command, { output: (config.frameworkName === 'tnp'), biggerBuffer: true }).sync();
  Helpers.writeFile([project.node_modules.path, '.install-date'], moment(new Date()).format('L LTS'))
}

export function prepareCommand(pkg: Models.npm.Package, remove: boolean, useYarn: boolean, project: Project) {
  const install = (remove ? 'uninstall' : 'install');
  let command = '';
  const noPackageLock = (project.isStandaloneProject) ? '--no-package-lock' : '';

  if (useYarn
    // || project.frameworkVersionAtLeast('v3') // yarn sucks
  ) {
    // --ignore-scripts
    // yarn install --prefer-offline
    const argsForFasterInstall = ` --no-audit`;
    command = `rm yarn.lock && touch yarn.lock && yarn ${pkg ? 'add' : ''} ${pkg ? pkg.name : ''} `
      + ` ${argsForFasterInstall} `
      + ` ${(pkg && pkg.installType && pkg.installType === '--save-dev') ? '-dev' : ''} `;
  } else {
    // --no-progress
    const argsForFasterInstall = `--force --ignore-engines ${config.frameworkName === 'firedev' ? '--silent' : ''} --no-audit `
      + ` ${noPackageLock} `;
    command = `npm ${install} ${pkg ? pkg.name : ''} `
      + ` ${(pkg && pkg.installType) ? pkg.installType : ''} `
      + ` ${argsForFasterInstall} `;
  }
  return command;
}


export function fixOptions(options?: Models.npm.ActualNpmInstallOptions): Models.npm.ActualNpmInstallOptions {
  if (_.isNil(options)) {
    options = {} as any;
  }
  if (_.isUndefined(options.generatLockFiles)) {
    options.generatLockFiles = false;
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
    options.reason = `Reason not defined`
  }
  return options;
}



export function fixOptionsNpmInstall(options: Models.npm.NpmInstallOptions,
  project: Project): Models.npm.NpmInstallOptions {
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
