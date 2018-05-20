import * as _ from 'lodash';
import { run, clearConsole } from "../process";
import { Project, ProjectIsomorphicLib, ProjectFrom } from '../project';
import { clear } from "./CLEAR";
import { BuildOptions, BuildDir, LibType, EnvironmentName } from "../models";
import { info, error } from "../messages";

import chalk from "chalk";
import { nearestProjectTo, crossPlatofrmPath } from '../helpers';

export interface BuildArgs {
    copyto: string[] | string;
    environmentName: string;
    envName: string;
}

function handleArguments(args: string) {
    if (process.platform === 'win32') {
        args = args.replace(/\\/g, '\\\\')
    }
    const argsObj: BuildArgs = require('minimist')(args.split(' '));
    let copyto: Project[] = []
    if (argsObj.copyto) {
        if (_.isString(argsObj.copyto)) {
            argsObj.copyto = [argsObj.copyto]
        }
        copyto = argsObj.copyto.map(path => {

            path = crossPlatofrmPath(path);
            // console.log('path', path)
            const project = nearestProjectTo(path);
            if (!project) {
                error(`Path doesn't contain tnp type project: ${path}`)
            }
            const what = `${project.name}/node_module/${Project.Current.name}`
            info(`After each build finish ${what} will be update.`)
            return project;
        });
    }
    let environmentName: EnvironmentName = 'local';
    if (argsObj.environmentName || argsObj.envName) {
        environmentName = (argsObj.environmentName ? argsObj.environmentName : argsObj.envName) as any;
    }
    return {
        copyto, environmentName
    }
}


export function buildLib(prod = false, watch = false, outDir: BuildDir, args: string) {
    clearConsole()
    const { copyto, environmentName } = handleArguments(args);
    const options: BuildOptions = {
        prod, watch, outDir, copyto, environmentName
    };
    build(options, ['angular-lib', 'isomorphic-lib', 'server-lib'])
}


export function buildApp(prod = false, watch = false, outDir: BuildDir = 'dist', args: string, noExit = false) {
    clearConsole()
    const { copyto, environmentName } = handleArguments(args);
    const options: BuildOptions = {
        prod, watch, outDir, appBuild: true, environmentName
    };
    build(options, ['angular-cli', 'angular-client', 'angular-lib', 'ionic-client', 'docker'], noExit);
}


function build(opt: BuildOptions, allowedLibs: LibType[], noExit = false) {

    const { prod, watch, outDir, appBuild, copyto } = opt;


    const project: Project = Project.Current;

    if (allowedLibs.includes(project.type)) {
        if (project.isSite) {
            project.recreate.join.init()
        }
        project.build(opt);
        if (watch) {
            if (project.isSite) {
                project.recreate.join.watch()
            }
        } else {
            process.exit(0)
        }
    } else {
        if (appBuild) {
            error(`App build only for tnp ${chalk.bold(allowedLibs.join(','))} project types`)
        } else {
            error(`Library build only for tnp ${chalk.bold(allowedLibs.join(','))} project types`)
        }
    }
}


export default {

    $BUILD_DIST: [(args) => buildLib(false, false, 'dist', args), `Build dist version of project library.`],
    $BUILD_DIST_WATCH: (args) => buildLib(false, true, 'dist', args),
    $BUILD_DIST_PROD: (args) => buildLib(true, false, "dist", args),

    $BUILD_BUNDLE: (args) => buildLib(false, false, 'bundle', args),
    $BUILD_BUNDLE_WATCH: (args) => buildLib(false, true, 'bundle', args),
    $BUILD_BUNDLE_PROD: (args) => buildLib(true, false, 'bundle', args),

    $BUILD_APP_PROD: (args) => buildApp(true, false, 'dist', args),
    $BUILD_APP: (args) => buildApp(false, false, 'dist', args),
    $BUILD_APP_WATCH: (args) => buildApp(false, true, 'dist', args),
    $BUILD_APP_START: (args) => {
        buildApp(false, false, 'dist', args, true);
        Project.Current.start();
    },
    $BUILD_APP_PROD_START: (args) => {
        buildApp(true, false, 'dist', args, true);
        Project.Current.start();
    },
    $START_APP: () => {
        Project.Current.start()
    },

    'Documentation': `
Building purpose:
- library
- application`

}