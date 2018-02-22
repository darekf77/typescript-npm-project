
import { run } from "../process";
import { Project, BUILD_ISOMORPHIC_LIB_WEBPACK } from '../project';
import { clear } from "./CLEAR";
import { BuildOptions, BuildDir } from "../models";


function build(buildApp = false, prod = false, watch = false, outDir: BuildDir = 'dist', project: Project = Project.Current, runAsync = false) {

    const options: BuildOptions = {
        prod, watch, project, outDir, buildApp
    };


    project.build(options);
    if (!watch) {
        process.exit(0)
    }

}


export default {
    BUILD_ISOMORPHIC_LIB_WEBPACK: (args: string) => {
        BUILD_ISOMORPHIC_LIB_WEBPACK(args)
    },

    $BUILD_DIST: () => build(false),
    $BUILD_DIST_PROD: () => build(false, true),
    $BUILD_DIST_WATCH: () => build(false, false, true, 'dist'),
    $BUILD_DIST_WATCH_PROD: () => build(false, true, true, 'dist'),

    $BUILD_DIST_APP: () => build(true),
    $BUILD_DIST_APP_PROD: () => build(true, true),
    $BUILD_DIST_APP_WATCH: () => build(true, false, true, 'dist'),
    $BUILD_DIST_APP_WATCH_PROD: () => build(true, true, true, 'dist'),

    $BUILD_BUNDLE: () => build(false, false, false, 'bundle'),
    $BUILD_BUNDLE_PROD: () => build(false, false, false, 'bundle'),
    $BUILD_BUNDLE_APP: () => build(true, false, false, 'bundle'),
    $BUILD_BUNDLE_APP_PROD: () => build(true, false, false, 'bundle')

}
