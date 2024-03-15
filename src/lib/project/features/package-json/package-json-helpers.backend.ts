//#region imports
import { crossPlatformPath, os, _ } from 'tnp-core/src';
import * as JSON5 from 'json5';
import chalk from 'chalk';
import * as semver from 'semver';
import { Project } from '../../abstract/project/project';
import { Models } from 'tnp-models/src';
import { Helpers } from 'tnp-helpers/src';
import { config, ConfigModels } from 'tnp-config/src';


// console.log([
//   versionForTagsPath,
//   versionForTags
// ])

//#endregion

//#region clean ignored
function clenIgnored(project: Project, deps: Object, overrided = {}) {
  if (_.isArray(project.packageJson?.data?.tnp?.overrided?.ignoreDepsPattern)) {
    const patterns = project.packageJson.data.tnp.overrided.ignoreDepsPattern;
    patterns.forEach(p => {
      Object.keys(deps).forEach(depName => {
        Helpers.log(`checking patter: ${p} agains ${depName}`, 2);
        const patternRegex = (new RegExp(Helpers.escapeStringForRegEx(p)));
        if (patternRegex.test(depName) && !overrided[depName]) {
          delete deps[depName];
        }
      });
    });
  }
}
//#endregion

//#region find npm version range
export function findVersionRange(rootProject: Project, dependency: Project | string) {
  let result: string;
  const name = _.isString(dependency) ? dependency : dependency.name;
  Models.npm.ArrNpmDependencyType.find(depType => {
    if (_.isObject(rootProject.packageJson.data[depType])) {
      const deps = rootProject.packageJson.data[depType];
      const versionRange = deps[name];
      if (_.isString(versionRange) && semver.validRange(versionRange)) {
        Helpers.log(`[findVersionRange] valid range founded "${name}":${versionRange}`);
        result = versionRange;
        return true;
      }
    }
    return false;
  });
  return result;
}
//#endregion

//#region resolve new deps and overrride for project
function resovleNewDepsAndOverrideForProject(project: Project) {
  let toOverrideDependencies = (project.packageJson.data.tnp.overrided &&
    project.packageJson.data.tnp.overrided.dependencies) ?
    project.packageJson.data.tnp.overrided.dependencies : {};

  let parentOverride = {};
  const orgNewDeps = _.cloneDeep((Project.Tnp).packageJson.data.dependencies);
  let newDepsForProject = {};


  if (project.isStandaloneProject && !project.isTnp) {
    newDepsForProject = getAndTravelCoreDeps({ type: project.type });
  } else {
    newDepsForProject = getAndTravelCoreDeps();
  }

  // console.log(JSON10.stringify(toOverrideDependencies))
  // try {
  _.merge(newDepsForProject, toOverrideDependencies);
  // } catch (error) {
  //   console.log(JSON10.stringify(toOverrideDependencies))
  //   process.exit(0)
  // }

  Object.keys(newDepsForProject).forEach(key => {
    if (_.isNull(newDepsForProject[key])) {
      newDepsForProject[key] = void 0;
    }
  });

  return {
    orgNewDeps,
    newDepsForProject,
    toOverrideDependencies,
    parentOverride
  };
}
//#endregion

//#region resolve and save deps for project
export function reolveAndSaveDeps(project: Project, action: Models.npm.SaveAction,
  reasonToHidePackages: string, reasonToShowPackages: string) {

  const orginalDependencies = !project.packageJson.data.dependencies ? {}
    : _.cloneDeep(project.packageJson.data.dependencies) as Models.npm.DependenciesFromPackageJsonStyle;

  const orginalDevDependencies = !project.packageJson.data.devDependencies ? {}
    : _.cloneDeep(project.packageJson.data.devDependencies) as Models.npm.DependenciesFromPackageJsonStyle;

  const { newDepsForProject, toOverrideDependencies } = resovleNewDepsAndOverrideForProject(project);

  overrideInfo({ orginalDependencies, orginalDevDependencies }, toOverrideDependencies, newDepsForProject);

  beforeSaveAction(project, {
    newDeps: newDepsForProject,
    toOverride: toOverrideDependencies,
    action,
    reasonToHidePackages,
    reasonToShowPackages,
  });

}
//#endregion

//#region override info
function overrideInfo(deps: { orginalDependencies: any; orginalDevDependencies: any }
  , toOverrideDependencies, newDepsForProject) {
  const { orginalDependencies, orginalDevDependencies } = deps;

  function check(orgDeps, checkinDev: boolean) {
    Object.keys(orgDeps).forEach(oldDepName => {
      if (orgDeps[oldDepName] !== newDepsForProject[oldDepName]) {
        //#region variables
        const oppositeOrgDeps = (checkinDev ? orginalDependencies : orginalDependencies);
        let overrideMsg: string;
        let foundedInOposite = false;
        let versionFrom = orgDeps[oldDepName];
        if (!versionFrom && oppositeOrgDeps[oldDepName]) {
          versionFrom = oppositeOrgDeps[oldDepName];
          foundedInOposite = true;
        }
        const versionTo = newDepsForProject[oldDepName];
        //#endregion

        if (toOverrideDependencies && !_.isUndefined(toOverrideDependencies[oldDepName])) {
          if (_.isNull(toOverrideDependencies[oldDepName])) {
            if (versionFrom) {
              overrideMsg = `Overrided/Remoed ${oldDepName}`;
            } else {
              overrideMsg = `Overrided without any sense ${oldDepName}`;
            }
          } else {
            if (versionFrom) {
              if (versionFrom === versionTo) {
                overrideMsg = `Overrided not necessary "${oldDepName}@${versionFrom}"`;
              } else {
                overrideMsg = `Overrided "${oldDepName}" ${versionFrom}=>${versionTo}`;
              }
            } else {
              overrideMsg = `Overrided/Added new packge ${oldDepName}@${versionTo}`;
            }
          }
        } else {
          if (_.isString(versionFrom) && _.isString(versionTo)) {
            if (versionFrom !== versionFrom) {
              overrideMsg = `Version change "${oldDepName}" ${versionFrom}=>${versionTo}`;
            }
          }
          if (!versionFrom && _.isString(versionTo)) {
            // if (!(Project.Tnp).packageJson.data.tnp.core.dependencies.asDevDependencies.includes(oldDepName)) {
            overrideMsg = `Added new package "${oldDepName}@${versionTo}"`;
            // }
          }
          if (_.isString(versionFrom) && !versionTo) {
            overrideMsg = `Removed package "${oldDepName}@${versionTo}"`;
          }
        }
        if (overrideMsg) {
          // Helpers.log(`[override-info] ${overrideMsg}`);
        } else {
          // warn(`No override info `);
        }

      }
    });
  }
  check(orginalDependencies, false);
  check(orginalDevDependencies, true);
}
//#endregion

//#region remove deps by type
function removeDepsByType(deps: object, libType: ConfigModels.LibType) {
  const depsByType = (Project.Tnp).packageJson.data.tnp.core.dependencies.onlyFor[libType];
  const names = depsByType ? Object.keys(depsByType) : [];
  names.forEach(key => {
    delete deps[key];
  });
  return deps;
}
//#endregion

//#region set dependency and save
export function setDependencyAndSave(p: Models.npm.Package, reason: string, project: Project,) {
  // console.log('set DEPS', p)
  // process.exit(0)
  if (!p || !p.name) {
    Helpers.error(`Cannot set invalid dependency for project ${project.genericName}: ${JSON5.stringify(p)}`, false, true);
  }

  if (project.isTnp && !_.isString(p.version)) {
    try {
      p.version = Helpers.run(`npm show ${p.name} version`, { output: false }).sync().toString().trim();
    } catch (e) {
      Helpers.error(`No able to find package with name ${p.name}`, false, true);
    }
  }

  if (project.isTnp) {
    let updated = false;
    getAndTravelCoreDeps({
      updateFn: (obj, pkgName) => {
        if (pkgName === p.name) {
          obj[pkgName] = p.version;
          updated = true;
        }
        return obj[pkgName];
      }
    });
    if (!updated) {
      project.packageJson.data.tnp.overrided.dependencies[p.name] = p.version;
    }
  } else if (project.isUnknowNpmProject) {
    if (p.installType === '--save') {
      if (!project.packageJson.data.dependencies) {
        project.packageJson.data.dependencies = {};
      }
      project.packageJson.data.dependencies[p.name] = p.version;
    } else if (p.installType === '--save-dev') {
      if (!project.packageJson.data.devDependencies) {
        project.packageJson.data.devDependencies = {};
      }
      project.packageJson.data.devDependencies[p.name] = p.version;
    }
  } else if (project.isStandaloneProject || project.isContainer) {

    if (p.version) {
      project.packageJson.data.tnp.overrided.dependencies[p.name] = p.version;
    } else {
      const { parentOverride, orgNewDeps } = resovleNewDepsAndOverrideForProject(project);
      if (_.isNull(parentOverride[p.name])) {
        project.packageJson.data.tnp.overrided.dependencies[p.name] = orgNewDeps[p.name];
      } else {
        delete project.packageJson.data.tnp.overrided.dependencies[p.name];
        Helpers.log(`Parent package version reverted`);
      }
    }
  }
  project.packageJson.save(`[${reason}] [setDependency] name:${p && p.name}, ver:${p && p.version} in project ${project && project.genericName
    }`);
}
//#endregion

//#region remove dependency and save
export function removeDependencyAndSave(p: Models.npm.Package, reason: string, project: Project) {

  if (!p || !p.name) {
    Helpers.error(`Cannot remove invalid dependency for project ${project.genericName}: ${JSON5.stringify(p)}`, false, true);
  }
  if (project.isTnp) {
    getAndTravelCoreDeps({
      updateFn: (obj, pkgName) => {
        if (pkgName === p.name) {
          obj[pkgName] = void 0;
        }
        return obj[pkgName];
      }
    });
  }
  if (project.isUnknowNpmProject) {
    project.packageJson.data.dependencies[p.name] = void 0;
    project.packageJson.data.devDependencies[p.name] = void 0;
  } else {
    if (project.isTnp) {
      const existedOverrideVer = project.packageJson.data.tnp.overrided.dependencies[p.name];
      if (_.isString(existedOverrideVer) || _.isNull(existedOverrideVer)) {
        project.packageJson.data.tnp.overrided.dependencies[p.name] = null;
      }
    } else {
      const { newDepsForProject } = resovleNewDepsAndOverrideForProject(project);
      const parentPkg = newDepsForProject[p.name];

      if (_.isString(parentPkg)) {
        project.packageJson.data.tnp.overrided.dependencies[p.name] = null;
      }
      if (_.isNull(parentPkg) || _.isUndefined(parentPkg)) {
        project.packageJson.data.tnp.overrided.dependencies[p.name] = void 0;
      }
    }
  }

  project.packageJson.save(`[${reason}] [removeDependency] name:${p && p.name} in project ${project && project.genericName
    }`);
}



//#endregion

//#region get deps by
export function getAndTravelCoreDeps(options?: {
  updateFn?: (obj: Object, pkgName: string) => string,
  type?: ConfigModels.LibType,
}) {
  const project: Project = Project.Tnp as any;
  if (_.isUndefined(options)) {
    options = {};
  }
  const { updateFn, type } = options;
  const constantTnpDeps = {};

  // if (project?.packageJson?.data?.tnp?.core?.dependencies) { // TODO QUICK FIX
  const core = project.packageJson.data.tnp.core.dependencies;
  travelObject(core.common, constantTnpDeps, void 0, updateFn);
  if (_.isString(type)) {
    travelObject(core.onlyFor[type], constantTnpDeps, core.onlyFor, updateFn);
  } else {
    Object.keys(core.onlyFor).forEach(libType => {
      travelObject(core.onlyFor[libType], constantTnpDeps, void 0, updateFn);
    });
  }
  // }

  return constantTnpDeps;
}
//#endregion

//#region deps filters
function filterDevDepOnly(project: Project, deps: Models.npm.DependenciesFromPackageJsonStyle) {
  const devDeps = (Project.Tnp).packageJson.data.tnp.core.dependencies.asDevDependencies;
  let onlyAsDevAllowed = (project.packageJson.data.tnp &&
    project.packageJson.data.tnp.overrided &&
    project.packageJson.data.tnp.overrided.includeAsDev) || [];

  const allDeps = getAndTravelCoreDeps();

  // log('d1evDeps', devDeps)
  Object.keys(deps).forEach(name => {
    if (!devDeps.includes(name)) {
      deps[name] = undefined;
    }
  });

  if (!_.isArray(onlyAsDevAllowed)) {
    onlyAsDevAllowed = [];
  }

  Object.keys(allDeps).forEach(name => {
    if (onlyAsDevAllowed.includes(name) || (onlyAsDevAllowed as any[]).filter(d => (new RegExp(d)).test(name)).length > 0) {
      deps[name] = allDeps[name];
    }
  });
  return deps;
}

function filterDepOnly(project: Project, deps: Models.npm.DependenciesFromPackageJsonStyle) {
  const devDeps = (Project.Tnp).packageJson.data.tnp.core.dependencies.asDevDependencies;
  let onlyAsDevAllowed = (project.packageJson.data.tnp.overrided.includeAsDev) || [];

  // log('d2evDeps', devDeps)
  if (onlyAsDevAllowed !== '*') {
    if (!_.isArray(onlyAsDevAllowed)) {
      onlyAsDevAllowed = [];
    }

    Object.keys(deps).forEach(name => {
      if (devDeps.includes(name) || onlyAsDevAllowed.includes(name) ||
        (onlyAsDevAllowed as any[]).filter(f => (new RegExp(f)).test(name)).length > 0) {
        deps[name] = undefined;
      }
    });
  }

  return deps;
}
//#endregion

//#region clean for include only
function cleanForIncludeOnly(project: Project, deps: Models.npm.DependenciesFromPackageJsonStyle,
  overrided: Models.npm.DependenciesFromPackageJsonStyle) {
  // log('overrided', overrided)

  deps[project.name] = undefined;

  if (project.packageJson.data.tnp &&
    project.packageJson.data.tnp.overrided &&
    _.isArray(project.packageJson.data.tnp.overrided.includeOnly) &&
    project.packageJson.data.tnp.overrided.includeOnly.length > 0
  ) {

    let onlyAllowed = project.packageJson.data.tnp.overrided.includeOnly;

    onlyAllowed = onlyAllowed.concat((Project.Tnp).packageJson.data.tnp.core.dependencies.always);

    Object.keys(deps).forEach(depName => {
      if (!onlyAllowed.includes(depName)) {
        deps[depName] = undefined;
      }
    });
    return;
  }
  clenIgnored(project, deps, overrided);


}
//#endregion

//#region travel object
function travelObject(obj: Object, out: Object, parent: Object, updateFn?: (obj: Object, pkgName: string) => string) {
  if (!_.isObject(obj)) {
    return;
  }
  Object.keys(obj).forEach(key => {
    const extendable = new RegExp(`^\@[0-9]$`);
    if (!extendable.test(key)) {
      if (!_.isArray(obj[key])) {
        if (_.isObject(obj[key])) {
          travelObject(obj[key], out, obj[key], updateFn);
        } else {
          if (_.isString(out[key])) {
            Helpers.error(`Duplicate key in workspace package.json tnp.core packages configuration:
            "${key}": "${out[key]}"
          `);
          }
          if (_.isFunction(updateFn)) {
            out[key] = updateFn(obj, key);
          } else {
            out[key] = obj[key];
          }
        }
      }
    } else if (!!parent) {
      // console.log('parent!11')
      // console.log(`parent[${key}]`, parent[key])
      travelObject(parent[obj[key]], out, parent, updateFn);
    }
  });
}
//#endregion

//#region before save action
function beforeSaveAction(project: Project, options: Models.npm.PackageJsonSaveOptions) {
  const { newDeps, toOverride, action, reasonToHidePackages, reasonToShowPackages } = options;

  const allTrusted = project.trusted;

  let recrateInPackageJson = (action === 'save' || action === 'show');
  if (project.isTnp) {
    recrateInPackageJson = true;
  }


  if (project.frameworkVersionAtLeast('v2') && !global.actionShowingDepsForContainer) {
    const projForVer = Project.by('container', project._frameworkVersion);
    if (projForVer) { // QUICK_FIX?
      global.actionShowingDepsForContainer = true;
      projForVer.packageJson.showDeps(`update deps for project ${project.genericName} in version ${project._frameworkVersion}`);
      global.actionShowingDepsForContainer = false;
      const depsForVer = projForVer.packageJson.data;
      Object.keys(depsForVer.dependencies).forEach(pkgNameInNewVer => {
        // Helpers.log(`Change "${chalk.bold(
        // pkgNameInNewVer)}": ${newDeps[pkgNameInNewVer]} => ${depsForVer.dependencies[pkgNameInNewVer]}`)
        newDeps[pkgNameInNewVer] = depsForVer.dependencies[pkgNameInNewVer];
      });
    }

  } else {
    cleanForIncludeOnly(project, newDeps, toOverride);
  }

  let devDependencies = {};

  let dependencies = {};

  if (project.frameworkVersionEquals('v1')) {
    devDependencies = project.isStandaloneProject ?
      Helpers.arrays.sortKeys(filterDevDepOnly(project, _.cloneDeep(newDeps)))
      : {};
    dependencies = project.isStandaloneProject ?
      Helpers.arrays.sortKeys(filterDepOnly(project, _.cloneDeep(newDeps)))
      : Helpers.arrays.sortKeys(newDeps);
  } else {
    devDependencies = project.isStandaloneProject ?
      Helpers.arrays.sortKeys(_.cloneDeep(newDeps))
      : {};
    dependencies = project.isStandaloneProject ?
      Helpers.arrays.sortKeys(_.cloneDeep(newDeps))
      : Helpers.arrays.sortKeys(newDeps);
  }

  if (!project.isTnp && !project.isContainerCoreProject) {
    const specyficPacakges = [
      'electron-client',
      'vscode-ext',
      'chrome-ext',
    ] as ConfigModels.LibType[];
    specyficPacakges.forEach(s => {
      if (project.typeIsNot(s)) {
        devDependencies = removeDepsByType(devDependencies, s);
        dependencies = removeDepsByType(dependencies, s);
      }
    });
  }

  if ((project.packageJson.data.tnp.overrided.includeAsDev as any) === '*') {
    devDependencies = _.merge(devDependencies, dependencies);
    dependencies = {};
    // console.log('inlcude as dev', devDependencies)
  }

  const onlyAllowedInDependencies = project.packageJson.data.tnp.overrided.includeOnly || [];
  if (project.frameworkVersionAtLeast('v2') && onlyAllowedInDependencies.length > 0) {

    // Helpers.info(`Inlcude only: \n${onlyAllowedInDependencies.join('\n')}`);

    const keyToDeleteDevDeps = [];
    Object.keys(devDependencies)
      .filter(key => !!devDependencies[key])
      .forEach(key => {
        // Helpers.info(`key devDependencies: ${key}@${devDependencies[key]}`)
        if (onlyAllowedInDependencies.includes(key)) {
          // Helpers.log(`Fix in devDependencies: ${key}@${devDependencies[key]}`);
          dependencies[key] = devDependencies[key];
          keyToDeleteDevDeps.push(key);
        }
      });

    const keyToDeleteDeps = [];
    Object.keys(dependencies)
      .filter(key => !!dependencies[key])
      .forEach(key => {
        // Helpers.info(`key dependencies: ${key}@${dependencies[key]}`)
        if (!onlyAllowedInDependencies.includes(key)) {
          // Helpers.log(`Fix in dependencies: ${key}@${dependencies[key]}`);
          devDependencies[key] = dependencies[key];
          keyToDeleteDeps.push(key);
        }
      });

    if (project.packageJson.data.tnp.overrided.includeOnly.includes('tnp')) {
      dependencies['tnp'] = `~${Project.Tnp?.version}`;
    }


    keyToDeleteDeps.forEach(key => {
      delete dependencies[key];
    });
    keyToDeleteDevDeps.forEach(key => {
      delete devDependencies[key];
    });

    // Helpers.log(`${chalk.bold('dependencies')}: \n${JSON.stringify(dependencies, null, 2)}`);
    // Helpers.log(`${chalk.bold('devDependencies')}: \n${JSON.stringify(devDependencies, null, 2)}`);
  }

  if (recrateInPackageJson) {
    Helpers.log(`[package.json] save for install - ${project.type} project: "${project.name}" , [${reasonToShowPackages}]`);
    if (project.isTnp) {
      project.packageJson.data.devDependencies = {};
      project.packageJson.data.dependencies = Helpers.arrays.sortKeys(newDeps);
      clenIgnored(project, project.packageJson.data.dependencies, {});
    } else {
      project.packageJson.data.devDependencies = devDependencies || {};
      project.packageJson.data.dependencies = dependencies;
    }
    //#region  install latest version of package

    // TODO firedev should be handled here
    Object.keys(project.packageJson.data.devDependencies)
      .filter(key => allTrusted.includes(key) || key === 'typeorm')
      .forEach(packageIsomorphicName => {
        const v = project.packageJson.data.devDependencies[packageIsomorphicName];
        if (!v?.startsWith('~') && !v?.startsWith('^')) {
          project.packageJson.data.devDependencies[packageIsomorphicName] = `~${v}`;
        }
      });

    Object.keys(project.packageJson.data.dependencies)
      .filter(key => allTrusted.includes(key) || key === 'typeorm')
      .forEach(packageIsomorphicName => {
        const v = project.packageJson.data.dependencies[packageIsomorphicName];
        if (!v?.startsWith('~') && !v?.startsWith('^')) {
          project.packageJson.data.dependencies[packageIsomorphicName] = `~${v}`;
        }
      });
    //#endregion

  } else {
    Helpers.log(`[package.json] save for clean - ${project.type} project: "${project.name}" , [${reasonToHidePackages}]`);
    project.packageJson.data.devDependencies = {};
    project.packageJson.data.dependencies = {};
    if (!project.isCoreProject && !project.isVscodeExtension) {
      project.packageJson.data.engines = void 0;
    }
  }

  Helpers.log(`Project: ${chalk.bold(project.genericName)}, framework verison: ${project._frameworkVersion}`);
  if (project.isTnp) {
    Helpers.log(`Execute ${config.frameworkName} action`);
    const keysToDelete = [];
    Object.keys(project.packageJson.data.tnp.overrided.dependencies).forEach((pkgName) => {
      const version = project.packageJson.data.tnp.overrided.dependencies[pkgName];
      if (!version && !devDependencies[pkgName] && !dependencies[pkgName]) {
        keysToDelete.push(pkgName);
      }
    });
    keysToDelete.forEach(key => {
      delete project.packageJson.data.tnp.overrided.dependencies[key];
    });
  }
  if (project.frameworkVersionAtLeast('v2')) {
    if (_.isEqual(project.packageJson.data.dependencies, project.packageJson.data.devDependencies)) {
      // TODO QUICK_FIX
      const includeAsDev = (project.packageJson.data.tnp.overrided.includeAsDev);
      const includeOnly = (project.packageJson.data.tnp.overrided.includeOnly);
      if (
        _.isArray(includeAsDev) && includeAsDev.length === 0 &&
        _.isArray(includeOnly) && includeOnly.length === 0
      ) {
        project.packageJson.data.devDependencies = {};
      }
      if (project.isVscodeExtension) {
        project.packageJson.data.devDependencies = project.packageJson.data.dependencies;
        project.packageJson.data.dependencies = {};
      }
    }
  }

  if (project.frameworkVersionAtLeast('v3')) {
    if (_.isArray(project.packageJson?.data?.tnp?.overrided?.ignoreDepsPattern)) {
      const patterns = project.packageJson.data.tnp.overrided.ignoreDepsPattern;
      patterns.forEach(patternIgnore => {
        Object.keys(project.packageJson.data.dependencies).forEach(depName => {
          Helpers.log(`check patter: ${patternIgnore} agains ${depName}`, 2);
          const patternRegex = (new RegExp(Helpers.escapeStringForRegEx(patternIgnore)));
          if (patternRegex.test(depName)) {
            delete project.packageJson.data.dependencies[depName];
          }
        });

        Object.keys(project.packageJson.data.devDependencies).forEach(depName => {
          Helpers.log(`check patter: ${patternIgnore} agains ${depName}`, 2);
          const patternRegex = (new RegExp(Helpers.escapeStringForRegEx(patternIgnore)));
          if (patternRegex.test(depName)) {
            delete project.packageJson.data.devDependencies[depName];
          }
        });
      });
    }
  }

  const maxVersionForAngular = project.trustedMaxMajorVersion;

  const versionForTagsPath = crossPlatformPath([Project.by('container', project._frameworkVersion).location, `../../versions-cache.json`,])
  const versionForTags = Helpers.readJson(versionForTagsPath, {});

  const lastVerFun = (pkgNameToCheckVer) => {
    const checkFor = `${pkgNameToCheckVer}@${maxVersionForAngular}`;
    if (versionForTags[checkFor]) {
      return versionForTags[checkFor];
    }
    process.stdout.write('.');
    try {
      if (!versionForTags[checkFor]) {
        // Helpers.info(`\nnot in cache from npm ${pkgNameToCheckVer}`)
        const lastVer = _.last(JSON.parse(Helpers.run(`npm view ${checkFor}  version --json`, { output: false, }).sync().toString()));
        versionForTags[checkFor] = `~${lastVer}`;
        Helpers.writeJson(versionForTagsPath, versionForTags);
      }
      return versionForTags[checkFor];
    } catch (error) {
      Helpers.error(`[firedev] Not able to get last versio of package: ${pkgNameToCheckVer}`, false, true);
    }
  };


  if (project.isContainerCoreProject) { // TODO TESTING
    //#region handle container core bulk deps instatlation for all other packages

    _.keys(project.packageJson.data.dependencies)
      .forEach(depName => {
        const v = project.packageJson.data.dependencies[depName];
        if (v === 'undefined') {
          delete project.packageJson.data.dependencies[depName];
        }
        if (v) {
          if (!_.isUndefined(config.packagesThat.areTrustedForPatchUpdate.find(s => {
            return depName.startsWith(s);
          }))) {
            project.packageJson.data.dependencies[depName] = `~${v.replace('~', '').replace(`^`, '')}`;
          } else {
            project.packageJson.data.dependencies[depName] = v.replace('~', '').replace(`^`, '');
          }

        }
      });
    _.keys(project.packageJson.data.devDependencies)
      .forEach(depName => {

        const v = project.packageJson.data.devDependencies[depName];
        if (v === 'undefined') {
          delete project.packageJson.data.dependencies[depName];
        }
        if (v) {
          if (!_.isUndefined(config.packagesThat.areTrustedForPatchUpdate.find(s => {
            return depName.startsWith(s);
          }))) {
            project.packageJson.data.dependencies[depName] = `~${v.replace('~', '').replace(`^`, '')}`;
          } else {
            project.packageJson.data.devDependencies[depName] = v.replace('~', '').replace(`^`, '');
          }
        }
      });

    if (project.frameworkVersionAtLeast('v3') && project.isContainerCoreProject) {
      const saveTnpFiredevVer = `^${_.first(Project.Tnp.version.split('.'))}`;
      if ((project._frameworkVersion === config.defaultFrameworkVersion)) {
        project.packageJson.data.dependencies['firedev'] = saveTnpFiredevVer;
      } else {
        project.packageJson.data.dependencies['firedev'] = lastVerFun('firedev');
      }
    }

    //#endregion
  }

  if (project.name === 'tnp') {
    delete project.packageJson.data.dependencies['tnp'];
    delete project.packageJson.data.dependencies['firedev'];
  }

  _.keys(project.packageJson.data.dependencies)
    .forEach(depName => {
      const v = project.packageJson.data.dependencies[depName];
      if (v === 'undefined') {
        delete project.packageJson.data.dependencies[depName];
      }
    });
  _.keys(project.packageJson.data.devDependencies)
    .forEach(depName => {
      const v = project.packageJson.data.devDependencies[depName];
      if (v === 'undefined') {
        delete project.packageJson.data.devDependencies[depName];
      }
    });


  if (project.isContainerCoreProject && project.frameworkVersionEquals('v1')) {
    project.packageJson.data.dependencies = {};
    project.packageJson.data.dependencies['webpack'] = '3.10.0'
    project.packageJson.data.dependencies['ts-loader'] = '9.3.1'
    project.packageJson.data.devDependencies = {}
  }


  // console.log({
  //   max,
  //   all: allTrusted,
  //   isCoreContainer: project.isContainerCoreProject
  // })

  // TODO SUPER QUICK_FIX
  if (project.isContainerCoreProject && project.frameworkVersionAtLeast('v3') && project.frameworkVersionLessThan(config.defaultFrameworkVersion)) {

    if (_.isNumber(maxVersionForAngular) && (maxVersionForAngular !== Number.POSITIVE_INFINITY)) {
      Helpers.log(`\nRebuilding old global container...`);
      allTrusted.forEach(trustedDepKey => {

        const depValueVersion = project.packageJson.data.dependencies[trustedDepKey];
        const devDepValueVersion = project.packageJson.data.devDependencies[trustedDepKey];
        // console.log({
        //   depValueVersion,
        //   devDepValueVersion,
        // })

        const lastKnownVersion = lastVerFun(trustedDepKey);

        if (depValueVersion) {
          const major = Number(_.first(depValueVersion.replace('~', '').replace('^', '').split('.')))
          if (major > maxVersionForAngular) {
            const overrideOldVersion = lastKnownVersion
            project.packageJson.data.dependencies[trustedDepKey] = overrideOldVersion;
          }
        }
        if (devDepValueVersion) {
          const major = Number(_.first(devDepValueVersion.replace('~', '').replace('^', '')))
          if (major > maxVersionForAngular) {
            const overrideOldversion = lastKnownVersion;
            project.packageJson.data.devDependencies[trustedDepKey] = overrideOldversion
          }
        }

      });
    }

  }

}
//#endregion
