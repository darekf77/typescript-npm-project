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
//#endregion


export function resolvePacakgesFromArgs(args: string[]): Package[] {
  let installType: InstalationType = '--save';
  return args
    .map(p => p.trim())
    .filter(p => {
      if (InstalationTypeArr.includes(p)) {
        installType = p as InstalationType;
        return false;
      }
      const res = checkValidNpmPackageName(p)
      if (!res) {
        error(`Invalid package to install: "${p}"`, true, true)
      }
      return res;
    })
    .map(p => {
      if (!~p.search('@')) {
        return { name: p, installType }
      }
      const isOrg = p.startsWith('@')
      const [name, version] = (isOrg ? p.slice(1) : p).split('@')
      return { name: isOrg ? `@${name}` : name, version, installType }
    })
}


export function executeCommand(command: string, project: Project) {
  project.run(command, { output: true, biggerBuffer: true }).sync();
}


export function copyMainProjectDependencies(projects: { mainProjectExisted: Project, mainProjectInTemp: Project; }, tmpProject: Project, project: Project, pkg: Package) {
  const { mainProjectExisted, mainProjectInTemp } = projects;

  const folderInNodeModules = fse.readdirSync(tmpProject.node_modules.path);
  folderInNodeModules
    .filter(name => name !== mainProjectInTemp.name)
    .filter(name => !name.startsWith('.'))
    .map(f => Project.From(path.join(tmpProject.node_modules.path, f)))
    .filter(f => !!f)
    .forEach(otherDependeny => {

      const existedPkgPath = path.join(project.node_modules.path, otherDependeny.name)
      const existedInNodeModules = Project.From(existedPkgPath);
      if (existedInNodeModules) {
        if (!mainProjectInTemp.packageJson.depenciesAreSatisfyBy(existedInNodeModules)) {
          const nestedPath = path.join(mainProjectExisted.node_modules.path, otherDependeny.name);
          if (fse.existsSync(nestedPath)) {
            fse.mkdirpSync(nestedPath)
          }
          log(`[smoothInstallPrepare] copy as nested dependency ${otherDependeny.name}`);
          tryCopyFrom(otherDependeny.location, nestedPath);
        } else {
          log(`[smoothInstallPrepare] nothing to do for ${otherDependeny.name}`);
        }
      } else {
        log(`[smoothInstallPrepare] copy new package ${otherDependeny.name}`);
        tryCopyFrom(otherDependeny.location, existedPkgPath);
      }
    });
  console.log('folderInNodeModules', folderInNodeModules);
}

export function copyMainProject(tmpProject: Project, project: Project, pkg: Package) {
  const mainProjectInTemp = Project.From(path.join(tmpProject.node_modules.path, pkg.name));
  const mainProjectExistedPath = path.join(project.node_modules.path, pkg.name)
  let mainProjectExisted = Project.From(mainProjectExistedPath);
  if (mainProjectExisted) {
    mainProjectExisted.removeItself();
  }
  tryCopyFrom(mainProjectInTemp.location, mainProjectExistedPath);
  log(`[smoothInstallPrepare] main package copy ${mainProjectInTemp.name}`);
  mainProjectExisted = Project.From(mainProjectExistedPath);
  return { mainProjectExisted, mainProjectInTemp };
}

export function prepareTempProject(project: Project, pkg: Package): Project {
  const tmpFolder = path.join(project.location,
    `${config.folder.tmp}-${config.folder.node_modules}-installation-of-${pkg.name}`);
  if (fse.existsSync(tmpFolder)) {
    rimraf.sync(tmpFolder);
  }
  fse.mkdirpSync(tmpFolder);
  project.packageJson.copyTo(tmpFolder);
  const tmpProject = Project.From(tmpFolder);
  tmpProject.packageJson.setNamFromContainingFolder();
  tmpProject.packageJson.hideDeps(`smooth instalation`);
  pkg.installType = '--save';
  const command = prepareCommand(pkg, false, false);
  executeCommand(command, tmpProject);
  return tmpProject;
}


export function prepareCommand(pkg: Package, remove: boolean, useYarn: boolean) {
  const install = (remove ? 'uninstall' : 'install');
  let command = '';
  if (useYarn) {
    command = `yarn ${pkg ? 'add' : install} --ignore-engines ${pkg ? pkg.name : ''} `
      + `${(pkg && pkg.installType && pkg.installType === '--save-dev') ? '-dev' : ''}`;
  } else {
    command = `npm ${install} ${pkg ? pkg.name : ''} ${(pkg && pkg.installType) ? pkg.installType : ''}`;
  }
  return command;
}


export function fixOptions(options?: ActualNpmInstallOptions): ActualNpmInstallOptions {
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
  if (_.isUndefined(options.smoothInstall)) {
    options.smoothInstall = false;
  }
  if (_.isUndefined(options.pkg)) {
    options.pkg = void 0;
  }
  if (_.isUndefined(options.reason)) {
    options.reason = `Reason not defined`
  }
  return options;
}
