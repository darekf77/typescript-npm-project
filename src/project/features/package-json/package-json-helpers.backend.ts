//#region imports
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import chalk from "chalk";

import { Project } from "../../abstract";
import { LibType, InstalationType, IPackageJSON, DependenciesFromPackageJsonStyle, UIFramework, PackageJsonSaveOptions } from "../../../models";
import { tryRemoveDir, sortKeys as sortKeysInObjAtoZ, run, error, info, warn, log, HelpersLinks } from "../../../helpers";
import { config } from '../../../config';

import * as _ from "lodash";
import { Morphi } from 'morphi';
//#endregion

export function reolveAndSaveDeps(project: Project, globalDeps, recrateInPackageJson: boolean, reasonToHidePackages: string, reasonToShowPackages: string) {
    let allDeps = getDepsBy();
    if(!globalDeps) {
        globalDeps = allDeps;
    }
    const oldDependencies = !project.packageJson.data.dependencies ? {} : _.cloneDeep(project.packageJson.data.dependencies) as DependenciesFromPackageJsonStyle;
    const toOverride = (project.packageJson.data.tnp.overrided &&
        project.packageJson.data.tnp.overrided.dependencies) ?
        project.packageJson.data.tnp.overrided.dependencies : {}

    // log('toOverride',toOverride)

    _.merge(globalDeps, toOverride);
    Object.keys(globalDeps).forEach(key => {
        if (_.isNull(globalDeps[key])) {
            globalDeps[key] = undefined;
        }
    })

    Object.keys(oldDependencies).forEach(oldDepName => {
        if (!globalDeps[oldDepName]) {

            if (allDeps[oldDepName]) {
                log(`Move from other lib type dependencies  : "${oldDepName}":"${oldDependencies[oldDepName]}" to ${project.type} `)
                overrideTnpDependencies(project, oldDepName, oldDependencies[oldDepName]);
            } else {
                log(`Overrided dependency  : "${oldDepName}":"${oldDependencies[oldDepName]}" saved in override.dependencies`)
                overrideTnpDependencies(project, oldDepName, oldDependencies[oldDepName]);
            }

        }

        if (toOverride && toOverride[oldDepName] && oldDependencies[oldDepName] !== globalDeps[oldDepName]) {
            log(`Overrided from "${oldDepName}":  "${oldDependencies[oldDepName]}"=>"${globalDeps[oldDepName]}"`)
        } else if (globalDeps[oldDepName] && globalDeps[oldDepName] !== oldDependencies[oldDepName]) {
            log(`Version change for "${oldDepName}":  "${oldDependencies[oldDepName]}"=>"${globalDeps[oldDepName]}"`)
        }
    })

    saveAction(project, {
        newDeps: globalDeps,
        toOverride,
        recrateInPackageJson,
        reasonToHidePackages,
        reasonToShowPackages,
    });

}

export function overrideTnpDependencies(project: Project, name: string, version: string) {
    //#region path
    if (!project.packageJson.data.tnp.overrided) {
        project.packageJson.data.tnp.overrided = {};
    }
    if (!project.packageJson.data.tnp.overrided.dependencies) {
        project.packageJson.data.tnp.overrided.dependencies = {}
    }
    //#endregion
    project.packageJson.data.tnp.overrided.dependencies[name] = version;
}



function saveAction(project: Project, options: PackageJsonSaveOptions) {
    const { newDeps, toOverride, recrateInPackageJson, reasonToHidePackages, reasonToShowPackages } = options;
    cleanForIncludeOnly(project, newDeps, toOverride);
    
    const engines = Project.Tnp.packageJson.data.engines;
    const license = project.isStandaloneProject ? 'MIT' : 'UNLICENSED';

    if (project.isStandaloneProject) {

        if (recrateInPackageJson) {
            log(`[package.json] save for install - standalone project: "${project.name}" , [${reasonToShowPackages}]`)
            project.packageJson.data.devDependencies = sortKeysInObjAtoZ(filterDevDepOnly(project, _.cloneDeep(newDeps)))
            project.packageJson.data.dependencies = sortKeysInObjAtoZ(filterDepOnly(project, _.cloneDeep(newDeps)))
            project.packageJson.data.engines = engines;
            project.packageJson.data.license = license;
            project.packageJson.save()
        } else {
            log(`[package.json] save for clean - standalone project: "${project.name}" , [${reasonToHidePackages}]`)
            project.packageJson.data.devDependencies = undefined;
            project.packageJson.data.dependencies = undefined;
            project.packageJson.data.engines = undefined
            project.packageJson.data.license = undefined;
            project.packageJson.save()
        }

    } else {
        project.packageJson.data.devDependencies = undefined;
        if (recrateInPackageJson) {
            log(`[package.json] save for install - workspace project: "${project.name}" , [${reasonToShowPackages}]`)
            project.packageJson.data.dependencies = sortKeysInObjAtoZ(newDeps)
            if (!project.isCoreProject) {
                project.packageJson.data.engines = engines;
                project.packageJson.data.license = license;
            }
            project.packageJson.save()
        } else {
            log(`[package.json] save for clean - workspace project: "${project.name}" , [${reasonToHidePackages}]`)
            project.packageJson.data.dependencies = undefined;
            if (!project.isCoreProject) {
                project.packageJson.data.engines = undefined;
                project.packageJson.data.license = undefined;
            }
            project.packageJson.save()
        }
    }
}

export function getDepsBy(type: LibType = undefined, updateFn?: (obj: Object, pkgName: string) => string) {
    const core = Project.Tnp.packageJson.data.tnp.core.dependencies;
    let newDeps = {};
    travelObject(core.common, newDeps, undefined, updateFn);
    if (_.isString(type)) {
        travelObject(core.onlyFor[type], newDeps, core.onlyFor, updateFn);
    } else {
        Object.keys(core.onlyFor).forEach(libType => {
            travelObject(core.onlyFor[libType], newDeps, undefined, updateFn);
        })
    }
    return newDeps;
}

function filterDevDepOnly(project: Project, deps: DependenciesFromPackageJsonStyle) {
    const devDeps = Project.Tnp.packageJson.data.tnp.core.dependencies.asDevDependencies;
    let onlyAsDevAllowed = (project.packageJson.data.tnp && project.packageJson.data.tnp.overrided && project.packageJson.data.tnp.overrided.includeAsDev) || [];
    let allDeps = getDepsBy();

    // log('d1evDeps', devDeps)
    Object.keys(deps).forEach(name => {
        if (!devDeps.includes(name)) {
            deps[name] = undefined;
        }
    })

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

function cleanForIncludeOnly(project: Project, deps: DependenciesFromPackageJsonStyle, overrided: DependenciesFromPackageJsonStyle) {
    // log('overrided', overrided)

    deps[project.name] = undefined;

    if (project.packageJson.data.tnp &&
        project.packageJson.data.tnp.overrided &&
        _.isArray(project.packageJson.data.tnp.overrided.includeOnly)) {

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
    })
}

