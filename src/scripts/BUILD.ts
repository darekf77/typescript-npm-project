import { run, clearConsole } from "../process";
import { Project, ProjectIsomorphicLib } from '../project';
import { clear } from "./CLEAR";
import { BuildOptions, BuildDir, LibType } from "../models";
import { info, error } from "../messages";
import chalk from "chalk";


export function buildLib(prod = false, watch = false, outDir: BuildDir = 'dist') {

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
    
    $BUILD_DIST: [() => buildLib(), `Build dist version of project library.`],
    $BUILD_DIST_WATCH: () => buildLib(false, true),
    $BUILD_DIST_PROD: () => buildLib(true),

    $BUILD_BUNDLE: () => buildLib(false, false, 'bundle'),
    $BUILD_BUNDLE_WATCH: () => buildLib(false, true, 'bundle'),
    $BUILD_BUNDLE_PROD: () => buildLib(true, false, 'bundle'),

    $BUILD_APP: () => buildApp(false, false),
    $BUILD_APP_WATCH: () => buildApp(false, true),


    'Documentation': `
Building purpose:
- library
- application`

}