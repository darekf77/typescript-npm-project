import * as _ from 'lodash';
import { run, clearConsole } from "../process";
import { Project, ProjectIsomorphicLib } from '../project';
import { clear } from "./CLEAR";
import { BuildOptions, BuildDir, LibType } from "../models";
import { info, error } from "../messages";

import chalk from "chalk";

export function copyToApps(apps: string[], watch = false) {
    console.log('apps', apps)
}

export function buildLib(prod = false, watch = false, outDir: BuildDir, args: string) {

    const argsObj: { linkto: string[] | string } = require('minimist')(args.split(' '));
    if (argsObj.linkto) {
        if (_.isString(argsObj.linkto)) {
            argsObj.linkto = [argsObj.linkto]
        }
        copyToApps(argsObj.linkto)
    }
    process.exit(1)

    const options: BuildOptions = {
        prod, watch, outDir
    };
    build(options, ['angular-lib', 'isomorphic-lib'])
}


export function buildApp(prod = false, watch = false, outDir: BuildDir = 'dist') {

    const options: BuildOptions = {
        prod, watch, outDir, appBuild: true
    };
    build(options, ['angular-cli', 'angular-client', 'angular-lib', 'ionic-client', 'docker']);
}


function build(opt: BuildOptions, allowedLibs: LibType[]) {

    const { prod, watch, outDir, appBuild } = opt;

    clearConsole()


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

    $BUILD_APP: () => buildApp(false, false),
    $BUILD_APP_WATCH: () => buildApp(false, true),


    'Documentation': `
Building purpose:
- library
- application`

}