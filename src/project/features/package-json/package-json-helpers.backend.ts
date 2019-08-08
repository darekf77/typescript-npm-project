//#region imports
import * as _ from 'lodash';
import { Project } from '../../abstract';
import { LibType, DependenciesFromPackageJsonStyle, PackageJsonSaveOptions } from '../../../models';
import { sortKeys as sortKeysInObjAtoZ, error, log, warn } from '../../../helpers';
//#endregion

//#region resolve and save deps for project
export function reolveAndSaveDeps(project: Project, recrateInPackageJson: boolean,
  reasonToHidePackages: string, reasonToShowPackages: string) {

  let newDepsForProject = {};
  if (project.isStandaloneProject && !project.isTnp) {
    newDepsForProject = getAndTravelCoreDeps({ type: project.type });
  } else {
    newDepsForProject = getAndTravelCoreDeps();
  }

  const orginalDependencies = !project.packageJson.data.dependencies ? {}
    : _.cloneDeep(project.packageJson.data.dependencies) as DependenciesFromPackageJsonStyle;

  const orginalDevDependencies = !project.packageJson.data.devDependencies ? {}
    : _.cloneDeep(project.packageJson.data.devDependencies) as DependenciesFromPackageJsonStyle;

  const toOverrideDependencies = (project.packageJson.data.tnp.overrided &&
    project.packageJson.data.tnp.overrided.dependencies) ?
    project.packageJson.data.tnp.overrided.dependencies : {};

  _.merge(newDepsForProject, toOverrideDependencies);
  Object.keys(newDepsForProject).forEach(key => {
    if (_.isNull(newDepsForProject[key])) {
      newDepsForProject[key] = void 0;
    }
  });

  overrideInfo({ orginalDependencies, orginalDevDependencies }, toOverrideDependencies, newDepsForProject);

  beforeSaveAction(project, {
    newDeps: newDepsForProject,
    toOverride: toOverrideDependencies,
    recrateInPackageJson,
    reasonToHidePackages,
    reasonToShowPackages,
  });

}
//#endregion

//#region override info
function overrideInfo(deps: { orginalDependencies: any; orginalDevDependencies: any }
  , toOverrideDependencies, newDepsForProject) {
  let { orginalDependencies, orginalDevDependencies } = deps;

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
            // if (!Project.Tnp.packageJson.data.tnp.core.dependencies.asDevDependencies.includes(oldDepName)) {
            overrideMsg = `Added new package "${oldDepName}@${versionTo}"`;
            // }
          }
          if (_.isString(versionFrom) && !versionTo) {
            overrideMsg = `Removed package "${oldDepName}@${versionTo}"`;
          }
        }
        if (overrideMsg) {
          log(`[override-info] ${overrideMsg}`);
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

//#region save action
function beforeSaveAction(project: Project, options: PackageJsonSaveOptions) {
  const { newDeps, toOverride, recrateInPackageJson, reasonToHidePackages, reasonToShowPackages } = options;
  cleanForIncludeOnly(project, newDeps, toOverride);

  const engines = Project.Tnp.packageJson.data.engines;
  const license = project.isStandaloneProject ? 'MIT' : 'UNLICENSED';

  if (project.isStandaloneProject) {
    const devDependencies = sortKeysInObjAtoZ(filterDevDepOnly(project, _.cloneDeep(newDeps)));
    const dependencies = sortKeysInObjAtoZ(filterDepOnly(project, _.cloneDeep(newDeps)));
    if (recrateInPackageJson) {
      log(`[package.json] save for install - standalone project: "${project.name}" , [${reasonToShowPackages}]`)
      project.packageJson.data.devDependencies = devDependencies;
      project.packageJson.data.dependencies = dependencies;
      project.packageJson.data.engines = engines;
      project.packageJson.data.license = license;
    } else {
      log(`[package.json] save for clean - standalone project: "${project.name}" , [${reasonToHidePackages}]`)
      project.packageJson.data.devDependencies = void 0;
      project.packageJson.data.dependencies = void 0;
      project.packageJson.data.engines = void 0;
      project.packageJson.data.license = void 0;
    }
    if (project.isTnp) {
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

  } else if (project.isWorkspace || project.isWorkspaceChildProject) {
    project.packageJson.data.devDependencies = void 0;
    if (recrateInPackageJson) {
      log(`[package.json] save for install - workspace project: "${project.name}" , [${reasonToShowPackages}]`)
      project.packageJson.data.dependencies = sortKeysInObjAtoZ(newDeps)
      if (!project.isCoreProject) {
        project.packageJson.data.engines = engines;
        project.packageJson.data.license = license;
      }
    } else {
      log(`[package.json] save for clean - workspace project: "${project.name}" , [${reasonToHidePackages}]`)
      project.packageJson.data.dependencies = void 0;
      if (!project.isCoreProject) {
        project.packageJson.data.engines = void 0;
        project.packageJson.data.license = void 0;
      }
    }
  }
}
//#endregion

//#region get deps by
export function getAndTravelCoreDeps(options?: {
  updateFn?: (obj: Object, pkgName: string) => string,
  type?: LibType,
}) {
  const project: Project = Project.Tnp;
  if (_.isUndefined(options)) {
    options = {};
  }
  const { updateFn, type } = options;
  const constantTnpDeps = {};

  const core = project.packageJson.data.tnp.core.dependencies;
  travelObject(core.common, constantTnpDeps, void 0, updateFn);
  if (_.isString(type)) {
    travelObject(core.onlyFor[type], constantTnpDeps, core.onlyFor, updateFn);
  } else {
    Object.keys(core.onlyFor).forEach(libType => {
      travelObject(core.onlyFor[libType], constantTnpDeps, void 0, updateFn);
    });
  }
  return constantTnpDeps;
}
//#endregion

//#region deps filters
function filterDevDepOnly(project: Project, deps: DependenciesFromPackageJsonStyle) {
  const devDeps = Project.Tnp.packageJson.data.tnp.core.dependencies.asDevDependencies;
  const onlyAsDevAllowed = (project.packageJson.data.tnp &&
    project.packageJson.data.tnp.overrided &&
    project.packageJson.data.tnp.overrided.includeAsDev) || [];

  const allDeps = getAndTravelCoreDeps();

  // log('d1evDeps', devDeps)
  Object.keys(deps).forEach(name => {
    if (!devDeps.includes(name)) {
      deps[name] = undefined;
    }
  });

  Object.keys(allDeps).forEach(name => {
    if (onlyAsDevAllowed.includes(name) || onlyAsDevAllowed.filter(d => (new RegExp(d)).test(name)).length > 0) {
      deps[name] = allDeps[name]
    }
  })

  return deps;
}

function filterDepOnly(project: Project, deps: DependenciesFromPackageJsonStyle) {
  const devDeps = Project.Tnp.packageJson.data.tnp.core.dependencies.asDevDependencies;
  let onlyAsDevAllowed = (project.packageJson.data.tnp
    && project.packageJson.data.tnp.overrided
    && project.packageJson.data.tnp.overrided.includeAsDev) || [];

  // log('d2evDeps', devDeps)
  Object.keys(deps).forEach(name => {
    if (devDeps.includes(name) || onlyAsDevAllowed.includes(name) || onlyAsDevAllowed.filter(f => (new RegExp(f)).test(name)).length > 0) {
      deps[name] = undefined;
    }
  })
  return deps;
}
//#endregion

//#region clean for include only
function cleanForIncludeOnly(project: Project, deps: DependenciesFromPackageJsonStyle, overrided: DependenciesFromPackageJsonStyle) {
  // log('overrided', overrided)

  deps[project.name] = undefined;

  if (project.packageJson.data.tnp &&
    project.packageJson.data.tnp.overrided &&
    _.isArray(project.packageJson.data.tnp.overrided.includeOnly) &&
    project.packageJson.data.tnp.overrided.includeOnly.length > 0
  ) {

    let onlyAllowed = project.packageJson.data.tnp.overrided.includeOnly;

    onlyAllowed = onlyAllowed.concat(Project.Tnp
      .packageJson.data.tnp.core.dependencies.always);

    Object.keys(deps).forEach(depName => {
      if (!onlyAllowed.includes(depName)) {
        deps[depName] = undefined;
      }
    });
    return;
  }

  if (project.packageJson.data.tnp &&
    project.packageJson.data.tnp.overrided &&
    _.isArray(project.packageJson.data.tnp.overrided.ignoreDepsPattern)) {
    const patterns = project.packageJson.data.tnp.overrided.ignoreDepsPattern;
    patterns.forEach(p => {
      Object.keys(deps).forEach(depName => {
        // log(`check patter: ${p} agains ${depName}`)
        if ((new RegExp(p)).test(depName) && !overrided[depName]) {
          deps[depName] = undefined;
        }
      })
    })

  }
}
//#endregion

//#region travel object
function travelObject(obj: Object, out: Object, parent: Object, updateFn?: (obj: Object, pkgName: string) => string) {
  Object.keys(obj).forEach(key => {
    if (key !== '@') {
      if (!_.isArray(obj[key])) {
        if (_.isObject(obj[key])) {
          travelObject(obj[key], out, obj[key], updateFn);
        } else {
          if (_.isString(out[key])) {
            error(`Duplicate key in workspace package.json tnp.core packages configuration:
            "${key}": "${out[key]}"
          `);
          }
          if (_.isFunction(updateFn)) {
            out[key] = updateFn(obj, key);
          } else {
            out[key] = obj[key]
          }
        }
      }
    } else if (!!parent) {
      travelObject(parent[key], out, parent, updateFn)
    }
  });
}
//#endregion
