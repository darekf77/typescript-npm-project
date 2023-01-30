//#region imports
import chalk from 'chalk';
import { path } from 'tnp-core';
import { fse } from 'tnp-core';
import { _, moment } from 'tnp-core';

import { Project } from '../../abstract';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { config } from 'tnp-config';
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
  project.run(command, { output: (config.frameworkName === 'tnp'), biggerBuffer: true }).sync();
  Helpers.writeFile([project.node_modules.path, '.install-date'], moment(new Date()).format('L LTS'))
}


export function copyMainProjectDependencies(projects: { mainProjectExisted: Project, mainProjectInTemp: Project; },
  tmpProject: Project, project: Project, pkg: Models.npm.Package) {

  const { mainProjectInTemp, mainProjectExisted } = projects;
  // if (!mainProjectExisted) {
  //   debugger;
  // }
  const alreadyChecked = [];
  function copyOtherProcess(parent: Project) {
    const otherDepsInTemp: Project[] = parent
      .allPackageJsonDeps(tmpProject.location)
      .filter(f => !alreadyChecked.includes(f));

    if (otherDepsInTemp.length === 0) {
      return;
    }
    otherDepsInTemp
      .filter(otherDependenyInTemp => {
        return fse.existsSync(path.join(tmpProject.node_modules.path, otherDependenyInTemp.name))
      })
      .forEach(otherDependenyInTemp => {

        const existedPkgPath = path.join(project.node_modules.path, otherDependenyInTemp.name)
        const existedOtherDependency = Project.From<Project>(existedPkgPath);
        if (existedOtherDependency) {
          if (existedOtherDependency.version === otherDependenyInTemp.version) {
            Helpers.log(`[smoothInstallPrepare] nothing to do for same dependency version ${otherDependenyInTemp.name}`);
          } else {
            if (parent.packageJson.checDepenciesAreSatisfyBy(existedOtherDependency)) {
              Helpers.log(`[smoothInstallPrepare] nothing to do dependency is satisfy ${otherDependenyInTemp.name}`);
            } else {
              const diff = `${existedOtherDependency.version} != ${otherDependenyInTemp.version}`;
              Helpers.warn(`[smoothInstallPrepare] "${parent.name}/${chalk.bold(otherDependenyInTemp.name)}" version not satisfy ${diff}`)
              const dest = path.join(project.node_modules.path, mainProjectExisted.name,
                config.folder.node_modules, otherDependenyInTemp.name);

              if (fse.existsSync(dest)) {
                Helpers.warn(`[smoothInstallPrepare] "${parent.name}/${chalk.bold(otherDependenyInTemp.name)}" nested already exists in neste folder`);
              } else {
                Helpers.mkdirp(dest);
                Helpers.warn(`[smoothInstallPrepare] "${parent.name}/${chalk.bold(otherDependenyInTemp.name)}" please copy manualy to nested folder`);
                // tryCopyFrom(otherDependenyInTemp.location, dest); // @TODO
              }
            }
          }
        } else {
          Helpers.log(`[smoothInstallPrepare] copy new package ${otherDependenyInTemp.name}`);
          Helpers.tryCopyFrom(otherDependenyInTemp.location, existedPkgPath);
        }
      });
    otherDepsInTemp.forEach(p => {
      alreadyChecked.push(p);
      copyOtherProcess(p);
    });
  }
  copyOtherProcess(mainProjectInTemp);
}

export function copyMainProject(tmpProject: Project, project: Project, pkg: Models.npm.Package) {
  const mainProjectInTemp = Project.From<Project>(path.join(tmpProject.node_modules.path, pkg.name));
  const mainProjectExistedPath = path.join(project.node_modules.path, pkg.name)
  Helpers.removeFolderIfExists(mainProjectExistedPath);
  Helpers.copy(mainProjectInTemp.location, mainProjectExistedPath);
  Helpers.log(`[smoothInstallPrepare] main package copy ${mainProjectInTemp.name}`);
  const mainProjectExisted = Project.From<Project>(mainProjectExistedPath);
  return { mainProjectExisted, mainProjectInTemp };
}

export function prepareTempProject(project: Project, pkg: Models.npm.Package): Project {
  if (!pkg.version) {
    try {
      pkg.version = Helpers.commnadOutputAsString(`npm show ${pkg.name} version`);
    } catch (error) {
      Helpers.log('pkg'+ JSON.stringify(pkg));
      Helpers.error(`[${config.frameworkName}] `
        + `not able to install package... try again with exact version or check package name.`, false, true);
    }
  }

  Helpers.info(`

      Packge ${pkg.name}@${pkg.version} will be installed..

      `)

  const pathPart = `${config.folder.tmp}-${config.folder.node_modules}-installation-of`;
  const tmpFolder = path.join(project.location, `${pathPart}-${pkg.name.replace('/', '-')}-${_.snakeCase(pkg.version)}`);

  Helpers.remove(`${path.join(project.location, pathPart)}*`);
  Helpers.mkdirp(tmpFolder);
  project.packageJson.copyTo(tmpFolder);
  const tmpProject = Project.From<Project>(tmpFolder);
  tmpProject.packageJson.setNamFromContainingFolder();
  tmpProject.packageJson.hideDeps(`smooth instalation`);
  tmpProject.packageJson.data.dependencies = {
    [pkg.name]: pkg.version
  };
  tmpProject.packageJson.data.devDependencies = {};
  tmpProject.packageJson.save('smooth install')
  const command = prepareCommand(pkg, false, false, project);
  try {
    executeCommand(command, tmpProject);
  } catch (error) {
    Helpers.error(`[${config.frameworkName}] `
      + `not able to install package... try again with exact version or check package name.`, false, true);
  }
  return tmpProject;
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
    const argsForFasterInstall = `--force --ignore-engines --silent --no-audit `
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
  if (_.isUndefined(options.smoothInstall)) {
    options.smoothInstall = false;
  }
  return options;
}
