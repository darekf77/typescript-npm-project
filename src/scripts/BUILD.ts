import { run } from "../process";
import { Project, ProjectIsomorphicLib } from '../project';
import { clear } from "./CLEAR";
import { BuildOptions, BuildDir, LibType } from "../models";
import { info, error } from "../messages";
import chalk from "chalk";


export function buildLib(prod = false, watch = false, outDir: BuildDir = 'dist') {

    const options: BuildOptions = {
        prod, watch, outDir
    };

    const project: Project = Project.Current;

    if ((project.type === 'angular-lib') || (project.type === 'isomorphic-lib')) {
        project.build(options);
        if (!watch) {
            process.exit(0)
        }
    } else {
        error(`Library build only for tnp ${chalk.bold('angular-lib')} project type`)
    }
}


export function buildApp(prod = false, watch = false, outDir: BuildDir = 'dist') {

    const options: BuildOptions = {
        prod, watch, outDir, appBuild: true
    };

    const project: Project = Project.Current;

    const allowedLibs: LibType[] = ['angular-cli', 'angular-client', 'angular-lib', 'ionic-client', 'docker'];

    if (allowedLibs.includes(project.type)) {
        project.build(options);
        if (!watch) {
            process.exit(0)
        }
    } else {
        error(`Library build only for tnp ${chalk.bold(allowedLibs.join(','))} project types`)
    }
}





export default {
    $BUILD_ISOMORPHIC_LIB_WEBPACK: (args: string) => {
        (Project.Current as ProjectIsomorphicLib).BUILD_ISOMORPHIC_LIB_WEBPACK(args);
        process.exit(0)
    },

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